import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import { Ticks } from "@audiotool/nexus/utils"
import {
  METHOD_BY_SAMPLE,
  ORDERED_SAMPLE_KEYS,
  PATTERNS_BY_SAMPLE,
} from "./const"
import type { RandomMethod, SampleKey } from "./types"

export const DEFAULT_LOOP_DURATION_CONFIG: LoopDurationConfig = {
  granularity: Ticks.SemiQuaver,
  min: 2,
  max: 16,
}
export const KICK_LOOP_DURATION_CONFIG: LoopDurationConfig = {
  granularity: Ticks.Beat,
  min: 2,
  max: 6,
}
export const HAT_LOOP_DURATION_CONFIG: LoopDurationConfig = {
  granularity: Ticks.SemiQuaver,
  min: 1,
  max: 16,
}

type LoopDurationConfig = {
  granularity: number
  min: number
  max: number
}

export const populateCollection = (
  t: SafeTransactionBuilder,
  {
    collection,
    sampleKey,
    patterns,
    loopDurationTicks,
    method,
  }: {
    collection: NexusEntity<"noteCollection">
    sampleKey: SampleKey
    patterns: number[][]
    loopDurationTicks: number
    method: RandomMethod
  },
) => {
  const steps = loopDurationTicks / Ticks.SemiQuaver
  const notes: NexusEntity<"note">[] = []

  if (method === "randomPattern") {
    patterns = [patterns[Math.round(Math.random() * (patterns.length - 1))]]
  }

  const putDownNote = (i: number, velocity: number) => {
    if (velocity === 0) {
      return
    }

    return t.create("note", {
      pitch: ORDERED_SAMPLE_KEYS.indexOf(sampleKey),
      collection: collection.location,
      positionTicks: i * Ticks.SemiQuaver,
      velocity,
    })
  }

  for (let i = 0; i < steps; i++) {
    const velocity = getStepVelocity(patterns, i)
    const note = putDownNote(i, velocity)
    if (note !== undefined) {
      notes.push(note)
    }
  }

  return notes
}

export const createPopulatedNoteCollection = (
  t: SafeTransactionBuilder,
  sampleKey: SampleKey,
  existingEntities?: { collection: NexusEntity<"noteCollection"> },
) => {
  if (
    existingEntities?.collection !== undefined &&
    t.entities.has(existingEntities.collection)
  ) {
    t.removeWithDependencies(existingEntities.collection)
  }
  const collection = t.create("noteCollection", {})
  const loopDurationTicks = getRandomLoopDuration(sampleKey)
  const patterns = PATTERNS_BY_SAMPLE[sampleKey]
  const method = METHOD_BY_SAMPLE[sampleKey]
  const notes: NexusEntity<"note">[] = []

  if (patterns) {
    notes.push(
      ...populateCollection(t, {
        collection,
        sampleKey,
        loopDurationTicks,
        patterns,
        method,
      }),
    )
  }

  return { collection, loopDurationTicks, notes }
}

export const getRandomLoopDuration = (sampleKey: SampleKey) => {
  switch (sampleKey) {
    case "kick":
      return generateLoopDuration(KICK_LOOP_DURATION_CONFIG)
    case "closed_hat":
      return generateLoopDuration(HAT_LOOP_DURATION_CONFIG)
    default:
      return generateLoopDuration(DEFAULT_LOOP_DURATION_CONFIG)
  }
}

export const generateLoopDuration = ({
  granularity,
  min,
  max,
}: LoopDurationConfig) => {
  return (
    granularity *
    Math.max(min, Math.min(max, Math.round(min + Math.random() * (max - min))))
  )
}

const getStepVelocity = (patterns: number[][], i: number) => {
  const velocities = patterns.reduce((velocities, pattern) => {
    if (pattern[i % pattern.length] >= 0) {
      velocities.push(pattern[i])
    }

    return velocities
  }, [] as number[])

  const probabilityOfStep = velocities.length / patterns.length
  return Math.random() > probabilityOfStep
    ? 0
    : velocities[Math.round(Math.random() * (velocities.length - 1))]
}

/**
 * Rounds a number to the nearest multiple of the given step.
 * @param value - The number to quantise
 * @param step - The step size to round to
 * @returns The quantised value
 * @example
 * quantise(7.3, 2) // returns 8
 * quantise(7.3, 5) // returns 5
 * quantise(12.7, 3) // returns 12
 */
export const quantise = (value: number, step: number): number => {
  return Math.round(value / step) * step
}
