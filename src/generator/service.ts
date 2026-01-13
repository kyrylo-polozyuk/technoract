import { ORDERED_SAMPLE_KEYS } from "../const"
import type { AudiotoolContextType } from "../context"
import type { SampleKey, TechnoState } from "../types"
import {
  clearProject,
  createSampleMidi,
  creteSynthMidiState,
  makeTechno,
} from "./nexus-util"
import {
  updateChannelBySample,
  updateMachinisteChannelsBySample,
} from "./parameter-updates"
import { createBass, createBassMidi } from "./setup/create-bass"
import { createMachinisteMixerChannel } from "./setup/create-machiniste"
import { createPad, createPadMidi } from "./setup/create-pad"

export class GeneratorService {
  #context: AudiotoolContextType
  #changesCallbacks: Set<(technoState: TechnoState | undefined) => void>
  #technoState: TechnoState | undefined

  constructor(context: AudiotoolContextType) {
    this.#context = context
    this.#changesCallbacks = new Set()
  }

  setTechnoState(technoState: TechnoState | undefined) {
    this.#technoState = technoState
    this.#notifyCallbacks()
  }

  subscribeToTechnoStateChanges(
    callback: (technoState: TechnoState | undefined) => void,
  ): () => void {
    this.#changesCallbacks.add(callback)
    return () => {
      this.#changesCallbacks.delete(callback)
    }
  }

  randomizeAll = async () => {
    if (this.#context.nexus !== undefined) {
      this.#technoState = await makeTechno(
        this.#context.nexus,
        this.#technoState,
      )
      this.#notifyCallbacks()
    }
  }

  clearAll = async () => {
    clearProject(this.#context)
    this.#technoState = undefined
    this.#notifyCallbacks()
  }

  randomizeDrum = (sampleKey: SampleKey) => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }
      const channelEntities =
        this.#technoState.machinisteMixerEntities.sampleMixerChannels[sampleKey]
      const midiEntities =
        this.#technoState.machinisteMidiEntities.tracksAndRegions[sampleKey]
      const mixerChannelEntities = createMachinisteMixerChannel(
        t,
        {
          sampleKey,
          orderAmongStrips: ORDERED_SAMPLE_KEYS.indexOf(sampleKey) + 3,
          colorIndex:
            channelEntities.channel.fields.displayParameters.fields.colorIndex
              .value,
          ...this.#technoState.machinisteMixerEntities,
          ...this.#technoState.mixerEntities,
        },
        channelEntities,
      )
      this.#technoState.machinisteMixerEntities.sampleMixerChannels[sampleKey] =
        mixerChannelEntities

      updateMachinisteChannelsBySample(
        t,
        this.#technoState.machinisteEntities.machiniste.fields.channels.array[
          ORDERED_SAMPLE_KEYS.indexOf(sampleKey)
        ],
        sampleKey,
      )
      updateChannelBySample(t, channelEntities.channel, sampleKey)

      const sampleMidiEntities = createSampleMidi(
        t,
        {
          machiniste: this.#technoState.machinisteEntities.machiniste,
          sampleKey,
          colorIndex: midiEntities.region.fields.region.fields.colorIndex.value,
        },
        midiEntities,
      )
      this.#technoState.machinisteMidiEntities.tracksAndRegions[sampleKey] =
        sampleMidiEntities
      this.#notifyCallbacks()
    })
  }

  clearDrum = (sampleKey: SampleKey) => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }

      for (const note of this.#technoState.machinisteMidiEntities
        .tracksAndRegions[sampleKey].notes) {
        t.remove(note)
      }

      this.#technoState.machinisteMidiEntities.tracksAndRegions[
        sampleKey
      ].notes = []

      this.#notifyCallbacks()
    })
  }

  clearBass = () => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }

      for (const note of this.#technoState.bassMidiEntities.notes) {
        t.remove(note)
      }

      this.#technoState.bassMidiEntities.notes = []

      this.#notifyCallbacks()
    })
  }

  clearPad = () => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }

      for (const note of this.#technoState.padMidiEntities.notes) {
        t.remove(note)
      }

      this.#technoState.padMidiEntities.notes = []

      this.#notifyCallbacks()
    })
  }

  randomizeBass = () => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }

      const bassEntities = createBass(
        t,
        {
          ...this.#technoState.mixerEntities,
          sidechainSource:
            this.#technoState.machinisteMixerEntities.sampleMixerChannels.kick
              .channel,
        },
        this.#technoState.bassEntities,
      )
      const bassMidiEntities = createBassMidi(
        t,
        {
          ...this.#technoState.bassEntities,
          rootNote: this.#technoState.rootNote,
        },
        this.#technoState.bassMidiEntities,
      )
      this.#technoState = {
        ...this.#technoState,
        bassMidiEntities,
        bassEntities,
      }
      this.#notifyCallbacks()
    })
  }

  randomizePad = () => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }
      const padEntities = createPad(
        t,
        {
          ...this.#technoState.mixerEntities,
          sidechainSource:
            this.#technoState.machinisteMixerEntities.sampleMixerChannels.kick
              .channel,
        },
        this.#technoState.padEntities,
      )
      const padMidiEntities = createPadMidi(
        t,
        {
          ...this.#technoState.padEntities,
          rootNote: this.#technoState.rootNote,
        },
        this.#technoState.padMidiEntities,
      )
      this.#technoState = {
        ...this.#technoState,
        padMidiEntities,
        padEntities,
      }
      this.#notifyCallbacks()
    })
  }

  randomizeNotes = () => {
    this.#context.nexus?.modify((t) => {
      if (this.#technoState === undefined) {
        return
      }

      this.#technoState = {
        ...this.#technoState,
        ...creteSynthMidiState(t, this.#technoState, this.#technoState),
      }
      this.#notifyCallbacks()
    })
  }

  #notifyCallbacks() {
    for (const callback of this.#changesCallbacks) {
      callback(this.#technoState)
    }
  }
}
