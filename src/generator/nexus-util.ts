import {
  type NexusEntity,
  type NexusObject,
  type SafeTransactionBuilder,
  type SyncedDocument,
} from "@audiotool/nexus/document"
import type { MachinisteChannel } from "@audiotool/nexus/entities"
import { ORDERED_SAMPLE_KEYS, SAMPLES } from "../const"
import type { AudiotoolContextType } from "../context"
import { createPopulatedNoteCollection } from "../pattern-util"
import type {
  AuxDelayEntities,
  AuxFlangerEntities,
  AuxReverbEntities,
  BassEntities,
  MachinisteEntities,
  MachinisteMidiEntities,
  MasterInsertEntities,
  MidiEntities,
  MixerEntities,
  PadEntities,
  SampleKey,
  TechnoState,
} from "../types"
import { REGION_DURATION_TICKS } from "./const"
import {
  updateFlanger,
  updateMachinisteChannelsBySample,
} from "./parameter-updates"
import { createBass, createBassMidi } from "./setup/create-bass"
import {
  createMachiniste,
  createMachinisteGroupCompressor,
  createMachinisteMixerChannels,
} from "./setup/create-machiniste"
import { createPad, createPadMidi } from "./setup/create-pad"

export const clearProject = async (context: AudiotoolContextType) => [
  await context.nexus?.modify((t) => {
    const allEntities = t.entities.get()

    for (const entity of allEntities) {
      if (
        entity.entityType !== "config" &&
        entity.entityType !== "groove" &&
        entity.entityType !== "mixerMaster" &&
        entity.entityType !== "sample"
      ) {
        if (t.entities.has(entity)) {
          t.removeWithDependencies(entity)
        }
      }
    }
  }),
]

export const createMixerOutAndAux = (
  t: SafeTransactionBuilder,
  entities?: MixerEntities,
): MixerEntities => {
  // main out
  const mixerMaster =
    entities?.mixerMaster ??
    t.entities.ofTypes("mixerMaster").getOne() ??
    t.create("mixerMaster", {
      limiterEnabled: true,
    })

  // aux
  const aux1 = entities?.aux1 ?? t.create("mixerAux", {})

  const aux2 =
    entities?.aux2 ??
    t.create("mixerAux", {
      trimFilter: {
        highPassCutoffFrequencyHz: 1000,
      },
    })

  const aux3 =
    entities?.aux3 ??
    t.create("mixerAux", {
      preGain: 0.75,
    })

  return { mixerMaster, aux1, aux2, aux3 }
}

export const createAuxDelay = (
  t: SafeTransactionBuilder,
  { aux1 }: { aux1: NexusEntity<"mixerAux"> },
  existingEntities?: AuxDelayEntities,
): AuxDelayEntities => {
  const pulsar =
    existingEntities?.pulsar ??
    t.create("pulsar", {
      displayName: "Aux Delay Pulsar (Technoract)",
      preDelayLeftTimeSemibreveIndex: 1,
      preDelayRightTimeSemibreveIndex: 5,
      feedbackDelayTimeSemibreveIndex: 5,
      filterMinHz: 325,
      dryGain: 0,
      lfoModulationDepthMs: 0.48,
      positionX: -200,
      positionY: -1000,
    })

  const audioCableIn =
    existingEntities?.audioCableIn ??
    t.create("desktopAudioCable", {
      fromSocket: aux1.fields.insertOutput.location,
      toSocket: pulsar.fields.audioInput.location,
    })

  const audioCableOut =
    existingEntities?.audioCableOut ??
    t.create("desktopAudioCable", {
      fromSocket: pulsar.fields.audioOutput.location,
      toSocket: aux1.fields.insertInput.location,
    })

  return { pulsar, audioCableIn, audioCableOut }
}

export const createAuxReverb = (
  t: SafeTransactionBuilder,
  { aux3 }: { aux3: NexusEntity<"mixerAux"> },
  existingEntities?: AuxReverbEntities,
): AuxReverbEntities => {
  const quasar =
    existingEntities?.quasar ??
    t.create("quasar", {
      displayName: "Aux Reverb Quasar (Technoract)",
      highPassFrequencyHz: 300,
      lowPassFrequencyHz: 8500,
      vibratoDepth: 0.125,
      dryGain: 0,
      wetGain: 1,
      positionX: 1100,
      positionY: -1000,
    })

  const audioCableIn =
    existingEntities?.audioCableIn ??
    t.create("desktopAudioCable", {
      fromSocket: aux3.fields.insertOutput.location,
      toSocket: quasar.fields.audioInput.location,
    })

  const audioCableOut =
    existingEntities?.audioCableOut ??
    t.create("desktopAudioCable", {
      fromSocket: quasar.fields.audioOutput.location,
      toSocket: aux3.fields.insertInput.location,
    })

  return { quasar, audioCableIn, audioCableOut }
}

export const createMasterInsertChain = (
  t: SafeTransactionBuilder,
  { mixerMaster }: { mixerMaster: NexusEntity<"mixerMaster"> },
  existingEntities?: MasterInsertEntities,
): MasterInsertEntities => {
  if (existingEntities?.audioCableQuantumOut === undefined) {
    const insertInput = t.entities.pointingTo
      .locations(mixerMaster.fields.insertInput.location)
      .getOne()
    if (insertInput !== undefined) {
      t.remove(insertInput)
    }
  }

  if (existingEntities?.audioCableCurveIn === undefined) {
    const insertOutput = t.entities.pointingTo
      .locations(mixerMaster.fields.insertOutput.location)
      .getOne()
    if (insertOutput !== undefined) {
      t.remove(insertOutput)
    }
  }

  const curve =
    existingEntities?.curve ??
    t.create("curve", {
      displayName: "Curve (Technoract)",
      gainDb: 15,
      spectrumModeIndex: 2,
      positionX: 1100,
      positionY: -300,
    })

  const quantum =
    existingEntities?.quantum ??
    t.create("quantum", {
      displayName: "Quantum (Technoract)",
      splitFrequencyHz: [125.5, 976.5, 3754],
      positionX: 1700,
      positionY: -300,
    })

  const audioCableCurveIn =
    existingEntities?.audioCableCurveIn ??
    t.create("desktopAudioCable", {
      fromSocket: mixerMaster.fields.insertOutput.location,
      toSocket: curve.fields.audioInput.location,
    })

  const audioCableQuantumIn =
    existingEntities?.audioCableQuantumIn ??
    t.create("desktopAudioCable", {
      fromSocket: curve.fields.audioOutput.location,
      toSocket: quantum.fields.audioInput.location,
    })

  const audioCableQuantumOut =
    existingEntities?.audioCableQuantumOut ??
    t.create("desktopAudioCable", {
      fromSocket: quantum.fields.audioOutput.location,
      toSocket: mixerMaster.fields.insertInput.location,
    })

  return {
    curve,
    quantum,
    audioCableCurveIn,
    audioCableQuantumIn,
    audioCableQuantumOut,
  }
}

export const createAuxFlanger = (
  t: SafeTransactionBuilder,
  { aux2 }: { aux2: NexusEntity<"mixerAux"> },
  existingEntities?: AuxFlangerEntities,
): AuxFlangerEntities => {
  const flanger =
    existingEntities?.flanger ??
    t.create("stompboxFlanger", {
      displayName: "Aux Flanger (Technoract)",
      feedbackFactor: 0.69,
      lfoModulationDepth: 1,
      delayTimeMs: 9,
      positionX: 600,
      positionY: -1000,
    })
  updateFlanger(t, flanger)

  const panorama =
    existingEntities?.panorama ??
    t.create("panorama", {
      displayName: "Panorama (Technoract)",
      leftPanning: -0.25,
      rightPanning: 0.25,
      positionX: 850,
      positionY: -1000,
    })

  const audioCableFlangerIn =
    existingEntities?.audioCableFlangerIn ??
    t.create("desktopAudioCable", {
      fromSocket: aux2.fields.insertOutput.location,
      toSocket: flanger.fields.audioInput.location,
    })

  const audioCablePanoramaIn =
    existingEntities?.audioCablePanoramaIn ??
    t.create("desktopAudioCable", {
      fromSocket: flanger.fields.audioOutput.location,
      toSocket: panorama.fields.audioInput.location,
    })

  const audioCablePanoramaOut =
    existingEntities?.audioCablePanoramaOut ??
    t.create("desktopAudioCable", {
      fromSocket: panorama.fields.audioOutput.location,
      toSocket: aux2.fields.insertInput.location,
    })

  return {
    flanger,
    panorama,
    audioCableFlangerIn,
    audioCablePanoramaIn,
    audioCablePanoramaOut,
  }
}

export const loadSamples = (t: SafeTransactionBuilder) => {
  const existingSamples = t.entities.ofTypes("sample").get()
  const samples = []
  const idsToLoad = Object.values(SAMPLES)

  for (const id of idsToLoad) {
    const existingSample = existingSamples.find(
      (s) => s.fields.sampleName.value === id,
    )
    if (existingSample === undefined) {
      samples.push(
        t.create("sample", {
          sampleName: id,
        }),
      )
    } else {
      samples.push(existingSample)
    }
  }

  return samples
}

export const loadSamplesIntoMachiniste = (
  t: SafeTransactionBuilder,
  machiniste: NexusEntity<"machiniste">,
) => {
  const samples = t.entities
    .ofTypes("sample")
    .get()
    .filter((sample) =>
      Object.values(SAMPLES).includes(sample.fields.sampleName.value),
    )

  for (let i = 0; i < samples.length; i++) {
    const channel = machiniste.fields.channels.array.at(i)
    const sample = samples.find(
      (sample) =>
        sample.fields.sampleName.value === SAMPLES[ORDERED_SAMPLE_KEYS[i]],
    )
    if (channel !== undefined && sample !== undefined) {
      t.update(channel.fields.sample, sample.location)
      Object.entries(SAMPLES).forEach(([key, value]) => {
        if (sample.fields.sampleName.value === value) {
          // Type assertion to ensure channel is properly typed
          updateMachinisteChannelsBySample(
            t,
            channel as NexusObject<MachinisteChannel>,
            key as SampleKey,
          )
        }
      })
    }
  }
}

export const createSampleMidi = (
  t: SafeTransactionBuilder,
  {
    machiniste,
    sampleKey,
    colorIndex,
  }: {
    machiniste: NexusEntity<"machiniste">
    sampleKey: SampleKey
    colorIndex: number
  },
  existingEntities?: MidiEntities,
): MidiEntities => {
  const track =
    existingEntities?.track ??
    t.create("noteTrack", {
      player: machiniste.location,
      orderAmongTracks: getNextTrackOrder(t),
    })

  const { collection, loopDurationTicks, notes } =
    createPopulatedNoteCollection(t, sampleKey, existingEntities)

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
      colorIndex,
    },
    collection: collection.location,
    track: track.location,
  })

  return { track, region, collection, notes }
}

export const createMachinisteMidi = (
  t: SafeTransactionBuilder,
  { machiniste }: { machiniste: NexusEntity<"machiniste"> },
  existingEntities?: MachinisteMidiEntities,
): MachinisteMidiEntities => {
  const tracksAndRegions: {
    [key in SampleKey]?: MidiEntities
  } = existingEntities?.tracksAndRegions ?? {}

  for (let i = 0; i < ORDERED_SAMPLE_KEYS.length; i++) {
    const { track, region, collection, notes } = createSampleMidi(
      t,
      {
        colorIndex: getNextColorIndex(),
        machiniste,
        sampleKey: ORDERED_SAMPLE_KEYS[i],
      },
      existingEntities?.tracksAndRegions[ORDERED_SAMPLE_KEYS[i]],
    )
    tracksAndRegions[ORDERED_SAMPLE_KEYS[i]] = {
      track,
      region,
      collection,
      notes,
    }
  }

  return {
    tracksAndRegions: tracksAndRegions as Required<typeof tracksAndRegions>,
  }
}

export const makeTechno = async (
  nexus: SyncedDocument,
  existingEntities?: TechnoState,
): Promise<TechnoState> => {
  await nexus.modify((t) => {
    loadSamples(t)
  })

  const config = await nexus.modify((t) => {
    return existingEntities?.config ?? t.entities.ofTypes("config").getOne()
  })

  if (config === undefined) {
    throw new Error("Config not found")
  }

  const mixerState = await nexus.modify((t) => {
    const mixerEntities = createMixerOutAndAux(
      t,
      existingEntities?.mixerEntities,
    )

    const auxDelayEntities = createAuxDelay(
      t,
      mixerEntities,
      existingEntities?.auxDelayEntities,
    )

    const auxFlangerEntities = createAuxFlanger(
      t,
      mixerEntities,
      existingEntities?.auxFlangerEntities,
    )

    const auxReverbEntities = createAuxReverb(
      t,
      mixerEntities,
      existingEntities?.auxReverbEntities,
    )

    const masterInsertEntities = createMasterInsertChain(
      t,
      { mixerMaster: mixerEntities.mixerMaster },
      existingEntities?.masterInsertEntities,
    )

    return {
      mixerEntities,
      auxDelayEntities,
      auxFlangerEntities,
      auxReverbEntities,
      masterInsertEntities,
    }
  })

  const machinisteState = await nexus.modify((t) => {
    const machinisteMixerEntities = createMachinisteMixerChannels(
      t,
      mixerState.mixerEntities,
      existingEntities?.machinisteMixerEntities,
    )

    const machinisteGroupCompressorEntities = createMachinisteGroupCompressor(
      t,
      machinisteMixerEntities,
      existingEntities?.machinisteGroupCompressorEntities,
    )

    const machinisteEntities = createMachiniste(
      t,
      machinisteMixerEntities,
      existingEntities?.machinisteEntities,
    )

    return {
      machinisteMixerEntities,
      machinisteEntities,
      machinisteGroupCompressorEntities,
    }
  })

  const synthState = await nexus.modify((t) => {
    const bassEntities = createBass(
      t,
      {
        ...mixerState.mixerEntities,
        sidechainSource:
          machinisteState.machinisteMixerEntities.sampleMixerChannels.kick
            .channel,
      },
      existingEntities?.bassEntities,
    )

    const padEntities = createPad(
      t,
      {
        ...mixerState.mixerEntities,
        sidechainSource:
          machinisteState.machinisteMixerEntities.sampleMixerChannels.kick
            .channel,
      },
      existingEntities?.padEntities,
    )

    return {
      bassEntities,
      padEntities,
    }
  })

  const machinisteMidiState = await nexus.modify((t) =>
    createMachinisteMidiState(t, machinisteState, existingEntities),
  )

  const synthMidiState = await nexus.modify((t) =>
    creteSynthMidiState(t, synthState, existingEntities),
  )

  return {
    config,
    ...mixerState,
    ...machinisteState,
    ...synthState,
    ...machinisteMidiState,
    ...synthMidiState,
  }
}

export const creteSynthMidiState = (
  t: SafeTransactionBuilder,
  {
    bassEntities,
    padEntities,
  }: {
    bassEntities: BassEntities
    padEntities: PadEntities
  },
  existingEntities?: TechnoState,
) => {
  const rootNote = randomRootNote(existingEntities?.rootNote)

  const bassMidiEntities = createBassMidi(
    t,
    { ...bassEntities, rootNote },
    existingEntities?.bassMidiEntities,
  )
  const padMidiEntities = createPadMidi(
    t,
    { ...padEntities, rootNote },
    existingEntities?.padMidiEntities,
  )

  return {
    rootNote,
    bassMidiEntities,
    padMidiEntities,
  }
}

export const createMachinisteMidiState = (
  t: SafeTransactionBuilder,
  {
    machinisteEntities,
  }: {
    machinisteEntities: MachinisteEntities
  },
  existingEntities?: TechnoState,
) => {
  loadSamplesIntoMachiniste(t, machinisteEntities.machiniste)

  const machinisteMidiEntities = createMachinisteMidi(
    t,
    machinisteEntities,
    existingEntities?.machinisteMidiEntities,
  )
  return {
    machinisteMidiEntities,
  }
}

export const getNextTrackOrder = (t: SafeTransactionBuilder) => {
  const trackEntities = t.entities
    .ofTypes("noteTrack", "audioTrack", "patternTrack", "automationTrack")
    .get()

  return (
    (trackEntities.length > 0
      ? Math.max(
          ...trackEntities.map(
            (entity) => entity.fields.orderAmongTracks.value,
          ),
        )
      : 0) + Math.random()
  )
}

let colorIndex = 0
export const getNextColorIndex = () => {
  return colorIndex++ % 32
}

export const randomRootNote = (currentRootNote?: number) => {
  return (
    24 +
    Math.round(
      currentRootNote ? (currentRootNote - 24 + 5) % 12 : Math.random() * 12,
    )
  )
}
