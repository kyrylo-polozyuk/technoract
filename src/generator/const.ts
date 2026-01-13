import { Ticks } from "@audiotool/nexus"

export const BASS_TRANSPOSE_AMOUNT = [-7, -5, -4, 0, 3, 5, 7] as const
export const PAD_TRANSPOSE_AMOUNT = [0, 3, 5, 7, 10, 12, 14] as const
export const CHORD_TRANSPOSE_AMOUNT = [0, 3, 5, 7, 14] as const
export const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const
export const REGION_DURATION_TICKS = Ticks.Beat * 4 * 64
