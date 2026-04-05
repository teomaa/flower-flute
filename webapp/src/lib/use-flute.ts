"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FluteSynth } from "./flute-synth";
import { NOTES } from "./notes";

export interface PinState {
  flute1: boolean;
  flute2: boolean;
  flute3: boolean;
  flute4: boolean;
  modeChange: boolean;
  mouthPiece: boolean;
}

export interface FluteState {
  pins: PinState;
  noteIndex: number;
  noteName: string;
  isConnected: boolean;
  audioStarted: boolean;
  startAudio: () => Promise<void>;
}

const DEFAULT_PINS: PinState = {
  flute1: false,
  flute2: false,
  flute3: false,
  flute4: false,
  modeChange: false,
  mouthPiece: false,
};

function decodePacked(packed: number): PinState {
  return {
    flute1: (packed & 0x01) !== 0,
    flute2: (packed & 0x02) !== 0,
    flute3: (packed & 0x04) !== 0,
    flute4: (packed & 0x08) !== 0,
    modeChange: (packed & 0x10) !== 0,
    mouthPiece: (packed & 0x20) !== 0,
  };
}

function getNoteIndex(pins: PinState): number {
  return (
    (pins.flute1 ? 1 : 0) |
    (pins.flute2 ? 2 : 0) |
    (pins.flute3 ? 4 : 0) |
    (pins.flute4 ? 8 : 0)
  );
}

export function useFlute(): FluteState {
  const [pins, setPins] = useState<PinState>(DEFAULT_PINS);
  const [isConnected, setIsConnected] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const synthRef = useRef<FluteSynth | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastMessageTime = useRef<number>(0);

  const startAudio = useCallback(async () => {
    if (audioStarted) return;
    synthRef.current = new FluteSynth();
    setAudioStarted(true);
  }, [audioStarted]);

  // WebSocket connection — sound is triggered directly in the callback,
  // bypassing React's render cycle for minimum latency
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket("ws://localhost:4211");
      wsRef.current = ws;

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 1000);
      };
      ws.onmessage = (event) => {
        const { packed } = JSON.parse(event.data);
        lastMessageTime.current = Date.now();
        setIsConnected(true);

        const newPins = decodePacked(packed);
        setPins(newPins);

        // Trigger sound immediately, don't wait for React re-render
        const synth = synthRef.current;
        if (synth) {
          const noteIndex = getNoteIndex(newPins);
          if (newPins.mouthPiece) {
            synth.noteOn(NOTES[noteIndex].frequency);
          } else {
            synth.noteOff();
          }
        }
      };
    }

    connect();

    // Mark disconnected if no data received for 2 seconds
    const staleness = setInterval(() => {
      if (Date.now() - lastMessageTime.current > 2000) {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(staleness);
      ws?.close();
    };
  }, []);

  const noteIndex = getNoteIndex(pins);

  return {
    pins,
    noteIndex,
    noteName: NOTES[noteIndex].name,
    isConnected,
    audioStarted,
    startAudio,
  };
}
