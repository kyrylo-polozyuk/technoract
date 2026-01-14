import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import { Ticks } from "@audiotool/nexus/utils"
import { generateLoopDuration } from "../../pattern-util"
import type { MidiEntities, PadEntities } from "../../types"
import { PAD_TRANSPOSE_AMOUNT, REGION_DURATION_TICKS } from "../const"
import { getNextColorIndex, getNextTrackOrder } from "../nexus-util"
import { updatePad } from "../parameter-updates"

export const createPad = (
  t: SafeTransactionBuilder,
  {
    sidechainSource,
  }: {
    sidechainSource: NexusEntity<"mixerChannel">
  },
  existingEntities?: PadEntities,
): PadEntities => {
  const channel =
    existingEntities?.channel ??
    t.create("mixerChannel", {
      displayParameters: {
        colorIndex: getNextColorIndex(),
        displayName: "Pad (Technoract)",
        orderAmongStrips: 3,
      },
      compressor: {
        isActive: true,
        ratio: 15,
        thresholdDb: -25,
      },
      preGain: 0.125,
      trimFilter: {
        highPassCutoffFrequencyHz: 200,
      },
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
      displayName: "Pad Pulverisateur (Technoract)",
      oscillatorA: {
        channel: {
          isActive: true,
        },
      },
      oscillatorB: {
        channel: {
          isActive: true,
        },
      },
      oscillatorC: {
        channel: {
          isActive: true,
          gain: 0.4,
        },
        oscillator: {
          tuneSemitones: 0.58,
          tuneOctaves: 1,
          waveform: 0.75,
        },
      },
      noise: {
        channel: {
          gain: 0.25,
        },
      },
      filter: {
        cutoffFrequencyHz: 69,
        keyboardTrackingAmount: 0.05,
      },
      gain: 0.125,
      filterEnvelope: {
        attackMs: 460,
        releaseMs: 400,
        modulationDepth: 0.17,
      },
      amplitudeEnvelope: {
        attackMs: 450,
        releaseMs: 400,
      },
      playModeIndex: 2,
      lfo: {
        targetsPulseWidth: true,
        targetsFilterCutoff: true,
      },
      positionX: 2000,
      positionY: 400,
    })
  updatePad(t, pulverisateur)

  const phaser =
    existingEntities?.phaser ??
    t.create("stompboxPhaser", {
      displayName: "Pad Phaser (Technoract)",
      minFrequencyHz: 30,
      maxFrequencyHz: 8000,
      lfoFrequencyHz: 4,
      mix: 0.66,
      feedbackFactor: 0.5,
      positionX: 2900,
      positionY: 400,
    })

  const chorus =
    existingEntities?.chorus ??
    t.create("stompboxChorus", {
      displayName: "Pad Chorus (Technoract)",
      delayTimeMs: 20,
      feedbackFactor: 0,
      lfoFrequencyHz: 4,
      spreadFactor: 0.126,
      lfoModulationDepth: 0.11,
      positionX: 3200,
      positionY: 400,
    })

  const pulsar =
    existingEntities?.pulsar ??
    t.create("pulsar", {
      displayName: "Pad Pulsar (Technoract)",
      preDelayRightTimeMs: 0,
      preDelayLeftTimeMs: 5,
      feedbackDelayTimeMs: 5,
      feedbackFactor: 0.88,
      filterMinHz: 200,
      filterMaxHz: 7500,
      stereoCrossFactor: 1,
      lfoModulationDepthMs: 1.25,
      lfoSpeedHz: 3,
      wetGain: 1,
      dryGain: 0.25,
      positionX: 3700,
      positionY: 400,
    })

  const quasar =
    existingEntities?.quasar ??
    t.create("quasar", {
      displayName: "Pad Quasar (Technoract)",
      dryGain: 1,
      wetGain: 0.125,
      highPassFrequencyHz: 483,
      filterSlopeIndex: 2,
      vibratoDepth: 0.3,
      positionX: 3200,
      positionY: 400,
    })

  const audioCablePhaserIn =
    existingEntities?.audioCablePhaserIn ??
    t.create("desktopAudioCable", {
      fromSocket: pulverisateur.fields.audioOutput.location,
      toSocket: phaser.fields.audioInput.location,
    })

  const audioCableChorusIn =
    existingEntities?.audioCableChorusIn ??
    t.create("desktopAudioCable", {
      fromSocket: phaser.fields.audioOutput.location,
      toSocket: chorus.fields.audioInput.location,
    })

  const audioCablePulsarIn =
    existingEntities?.audioCablePulsarIn ??
    t.create("desktopAudioCable", {
      fromSocket: chorus.fields.audioOutput.location,
      toSocket: pulsar.fields.audioInput.location,
    })

  const audioCableQuasarIn =
    existingEntities?.audioCableQuasarIn ??
    t.create("desktopAudioCable", {
      fromSocket: pulsar.fields.audioOutput.location,
      toSocket: quasar.fields.audioInput.location,
    })

  const audioCableQuasarOut =
    existingEntities?.audioCableQuasarOut ??
    t.create("desktopAudioCable", {
      fromSocket: quasar.fields.audioOutput.location,
      toSocket: channel.fields.audioInput.location,
    })

  return {
    channel,
    pulverisateur,
    sideChainRoute,
    phaser,
    chorus,
    pulsar,
    quasar,
    audioCablePhaserIn,
    audioCableChorusIn,
    audioCablePulsarIn,
    audioCableQuasarIn,
    audioCableQuasarOut,
  }
}

export const createPadMidi = (
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
  const transposeAmounts = [...PAD_TRANSPOSE_AMOUNT]
  for (let i = 0; i < 5; i++) {
    const transposeIndex = Math.round(
      Math.random() * (transposeAmounts.length - 1),
    )

    notes.push(
      t.create("note", {
        pitch:
          24 +
          rootNote +
          transposeAmounts[transposeIndex] +
          12 * Math.round(Math.random() * 2),
        collection: collection.location,
        positionTicks: 0,
        durationTicks: loopDurationTicks,
        velocity: 0.5 + Math.random() * 0.5,
      }),
    )

    transposeAmounts.splice(transposeIndex, 1)
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
