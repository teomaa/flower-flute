"use client";

import { useEffect, useRef } from "react";
import { FlowerCanvas } from "@/lib/flower-canvas";

interface FlowerVisProps {
  isPlaying: boolean;
  noteIndex: number;
}

export default function FlowerVis({ isPlaying, noteIndex }: FlowerVisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowerCanvas | null>(null);
  const prevPlaying = useRef(false);
  const prevNote = useRef(-1);

  // Initialize canvas renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new FlowerCanvas(canvasRef.current);
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // React to play state and note changes
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isPlaying) {
      // Spawn flower on note start or note change while playing
      if (!prevPlaying.current || noteIndex !== prevNote.current) {
        if (prevPlaying.current && noteIndex !== prevNote.current) {
          // Note changed while playing — release the old flower first
          renderer.releaseAll();
        }
        renderer.spawnFlower(noteIndex);
      }
    } else if (prevPlaying.current) {
      // Just stopped playing — release all
      renderer.releaseAll();
    }

    prevPlaying.current = isPlaying;
    prevNote.current = noteIndex;
  }, [isPlaying, noteIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
