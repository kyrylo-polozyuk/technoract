import { Ticks } from "@audiotool/nexus"
import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import { generateLoopDuration } from "../../pattern-util"
import type { BassEntities, MidiEntities } from "../../types"
import { BASS_TRANSPOSE_AMOUNT, REGION_DURATION_TICKS } from "../const"
import { getNextColorIndex, getNextTrackOrder } from "../nexus-util"
import { updateBass, updateBassPulsar } from "../parameter-updates"

export const createBassMidi = (
  t: SafeTransactionBuilder,
  {
    pulverisateur,
    rootNote,
  }: { pulverisateur: NexusEntity<"pulverisateur">; rootNote: number },
  existingEntities?: MidiEntities,
): MidiEntities => {
  const track =
    existingEntities?.track ??
    t.create("noteTrack", {
      player: pulverisateur.location,
      orderAmongTracks: getNextTrackOrder(t),
    })

  if (
    existingEntities?.collection !== undefined &&
    t.entities.has(existingEntities.collection)
  ) {
    t.removeWithDependencies(existingEntities.collection)
  }

  const collection = t.create("noteCollection", {})
  const loopDurationTicks = generateLoopDuration({
    granularity: Ticks.SemiQuaver,
    min: 2,
    max: 16,
  })
  const notes: NexusEntity<"note">[] = []

  let noteCount = 0
  let i = 0
  while (i < loopDurationTicks) {
    const noteDuration =
      Ticks.SemiQuaver *
      Math.round(
        Math.random() * Math.min(loopDurationTicks / Ticks.SemiQuaver, 4),
      )

    if (
      Math.random() > 0.5 ||
      (i + noteDuration >= loopDurationTicks && noteCount === 0)
    ) {
      notes.push(
        t.create("note", {
          pitch:
            rootNote +
            BASS_TRANSPOSE_AMOUNT[
              Math.round(Math.random() * (BASS_TRANSPOSE_AMOUNT.length - 1))
            ],
          collection: collection.location,
          positionTicks: i,
          durationTicks: noteDuration,
          velocity: 0.5 + Math.random() * 0.5,
        }),
      )
      noteCount++
    }

    i += noteDuration
  }

  // delete old region
  if (
    existingEntities?.region !== undefined &&
    t.entities.has(existingEntities.region)
  ) {
    t.removeWithDependencies(existingEntities.region)
  }

  const region = t.create("noteRegion", {
    region: {
      positionTicks: 0,
      durationTicks: REGION_DURATION_TICKS,
      loopDurationTicks,
      collectionOffsetTicks: 0,
      colorIndex: getNextColorIndex(),
    },
    collection: collection.location,
    track: track.location,
  })

  return { track, region, collection, notes }
}

export const createBass = (
  t: SafeTransactionBuilder,
  {
    sidechainSource,
    aux2,
  }: {
    sidechainSource: NexusEntity<"mixerChannel">
    aux2: NexusEntity<"mixerAux">
  },
  existingEntities?: BassEntities,
): BassEntities => {
  const channel =
    existingEntities?.channel ??
    t.create("mixerChannel", {
      displayParameters: {
        colorIndex: getNextColorIndex(),
        displayName: "Bass (Technoract)",
        orderAmongStrips: 1,
      },
      compressor: {
        isActive: true,
        ratio: 15,
        thresholdDb: -25,
      },
      preGain: 0.4,
    })

  const auxRoute =
    existingEntities?.auxRoute ??
    t.create("mixerAuxRoute", {
      auxSend: channel.fields.auxSend.location,
      auxReceive: aux2.location,
      gain: 0.5,
    })

  const sideChainRoute =
    existingEntities?.sideChainRoute ??
    t.create("mixerSideChainCable", {
      from: sidechainSource.fields.sideChainOutput.location,
      to: channel.fields.compressor.fields.sideChainInput.location,
    })

  const pulverisateur =
    existingEntities?.pulverisateur ??
    t.create("pulverisateur", {
      displayName: "Bass Pulverisateur (Technoract)",
      oscillatorA: {
        oscillator: {
          waveform: 1,
        },
      },
      oscillatorB: {
        channel: {
          isActive: false,
        },
      },
      oscillatorC: {
        channel: {
          isActive: false,
        },
      },
      noise: {
        channel: {
          gain: 0.25,
        },
      },
      gain: 0.5,
      filterEnvelope: {
        releaseMs: 400,
        modulationDepth: 0.17,
      },
      amplitudeEnvelope: {
        releaseMs: 400,
      },
      playModeIndex: 1,
      lfo: {
        targetsFilterCutoff: true,
        modulationDepth: 0.125,
      },
      positionX: 0,
      positionY: 400,
    })
  updateBass(t, pulverisateur)

  const pulsar =
    existingEntities?.pulsar ??
    t.create("pulsar", {
      displayName: "Bass Pulsar (Technoract)",
      preDelayLeftTimeSemibreveIndex: 5,
      preDelayRightTimeSemibreveIndex: 1,
      preDelayRightTimeMs: 0,
      feedbackDelayTimeSemibreveIndex: 5,
      filterMinHz: 200,
      filterMaxHz: 7500,
      stereoCrossFactor: 0.65,
      lfoModulationDepthMs: 1,
      wetGain: 0.33,
      positionX: 1000,
      positionY: 400,
    })
  updateBassPulsar(t, pulsar)

  const audioCablePulsarIn =
    existingEntities?.audioCablePulsarIn ??
    t.create("desktopAudioCable", {
      fromSocket: pulverisateur.fields.audioOutput.location,
      toSocket: pulsar.fields.audioInput.location,
    })

  const audioCablePulsarOut =
    existingEntities?.audioCablePulsarOut ??
    t.create("desktopAudioCable", {
      fromSocket: pulsar.fields.audioOutput.location,
      toSocket: channel.fields.audioInput.location,
    })

  return {
    channel,
    pulverisateur,
    sideChainRoute,
    pulsar,
    auxRoute,
    audioCablePulsarIn,
    audioCablePulsarOut,
  }
}
