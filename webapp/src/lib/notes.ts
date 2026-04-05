export interface NoteInfo {
  name: string;
  frequency: number;
}

// C major scale across two octaves (C4–D6), indexed by 4-bit flute finger value
export const NOTES: NoteInfo[] = [
  { name: "C4", frequency: 261.63 },
  { name: "D4", frequency: 293.66 },
  { name: "E4", frequency: 329.63 },
  { name: "F4", frequency: 349.23 },
  { name: "G4", frequency: 392.0 },
  { name: "A4", frequency: 440.0 },
  { name: "B4", frequency: 493.88 },
  { name: "C5", frequency: 523.25 },
  { name: "D5", frequency: 587.33 },
  { name: "E5", frequency: 659.26 },
  { name: "F5", frequency: 698.46 },
  { name: "G5", frequency: 783.99 },
  { name: "A5", frequency: 880.0 },
  { name: "B5", frequency: 987.77 },
  { name: "C6", frequency: 1046.5 },
  { name: "D6", frequency: 1174.66 },
];
