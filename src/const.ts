import {
  CLAP,
  HATS,
  KICKS,
  OPEN_HATS,
  RIDE,
  SHAKER,
  TWIG,
} from "./generator/patterns"
import type { RandomMethod, SampleKey } from "./types"

export const ORDERED_SAMPLE_KEYS = [
  "kick",
  "closed_hat",
  "twig",
  "shaker",
  "clap",
  "ride",
  "open_hat",
] as const

let numberShortcut = 0
const getNumberShortcut = () => {
  numberShortcut = (numberShortcut + 1) % 10
  return numberShortcut.toString()
}

export const SYNTH_SHORTCUTS = {
  bassMidiEntities: getNumberShortcut(),
  padMidiEntities: getNumberShortcut(),
} as const

export const SAMPLE_SHORTCUTS = {
  kick: getNumberShortcut(),
  closed_hat: getNumberShortcut(),
  twig: getNumberShortcut(),
  shaker: getNumberShortcut(),
  clap: getNumberShortcut(),
  ride: getNumberShortcut(),
  open_hat: getNumberShortcut(),
} satisfies Record<SampleKey, string>

export const SAMPLES: { [key in SampleKey]: string } = {
  kick: "samples/00d88265-c482-52aa-89c5-265fdfa207e2",
  closed_hat: "samples/5f8458b5-c6c7-5fe6-b68c-02d0ba3c8d13",
  twig: "samples/37b0f6fd-2c3c-5854-b43c-383cc03d3125",
  shaker: "samples/8551e768-886b-544d-bf29-e9c7c2522bad",
  clap: "samples/97cc43b9-3cc2-52ca-bde7-3a89b339701a",
  ride: "samples/20799e8e-6f4f-5b8b-a78e-b3ed0c0ef65f",
  open_hat: "samples/2c2a6124-8201-5c59-a112-ee2f84ba756a",
}

export const PATTERNS_BY_SAMPLE: { [key in SampleKey]: number[][] } = {
  kick: KICKS,
  closed_hat: HATS,
  twig: TWIG,
  shaker: SHAKER,
  clap: CLAP,
  ride: RIDE,
  open_hat: OPEN_HATS,
}

export const METHOD_BY_SAMPLE: { [key in SampleKey]: RandomMethod } = {
  kick: "randomPattern",
  closed_hat: "probability",
  twig: "probability",
  shaker: "probability",
  clap: "probability",
  ride: "probability",
  open_hat: "probability",
}
