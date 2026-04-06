"use client";

import { useFlute } from "@/lib/use-flute";
import FlowerVis from "@/components/FlowerVis";

const PIN_LABELS = [
  { key: "flute1" as const, label: "Flute1" },
  { key: "flute2" as const, label: "Flute2" },
  { key: "flute3" as const, label: "Flute3" },
  { key: "flute4" as const, label: "Flute4" },
  { key: "modeChange" as const, label: "ModeChange" },
  { key: "mouthPiece" as const, label: "MouthPiece" },
];

export default function Home() {
  const { pins, noteName, noteIndex, modeName, isConnected, audioStarted, startAudio } =
    useFlute();

  return (
    <>
      <FlowerVis isPlaying={pins.mouthPiece} noteIndex={noteIndex} />

      <div className="relative min-h-screen bg-transparent text-white font-mono p-8" style={{ zIndex: 1 }}>
        <h1 className="text-2xl mb-6">Flower Flute!</h1>

        <div className="mb-4 flex items-center gap-3">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-zinc-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {!audioStarted && (
          <button
            onClick={startAudio}
            className="mb-6 px-4 py-2 bg-white text-black rounded hover:bg-zinc-200"
          >
            Start Audio
          </button>
        )}

        <div className="mb-6 space-y-1">
          {PIN_LABELS.map(({ key, label }) => (
            <div key={key} className="flex gap-2">
              <span className="w-28">{label}:</span>
              <span className={pins[key] ? "text-green-400" : "text-zinc-600"}>
                {pins[key] ? "YES" : "NO"}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4 text-lg">
          Mode: <span className="text-blue-400">{modeName}</span>
        </div>

        <div className="text-4xl">
          Note: <span className="text-yellow-400">{noteName}</span>
          {pins.mouthPiece && (
            <span className="ml-4 text-green-400 text-lg">♪ playing</span>
          )}
        </div>
      </div>
    </>
  );
}
