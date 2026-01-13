import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import { ORDERED_SAMPLE_KEYS } from "../../const"
import type {
  MachinisteEntities,
  MachinisteGroupCompressorEntities,
  MachinisteMixerEntities,
  MixerEntities,
  SampleKey,
  SampleMixerEntities,
} from "../../types"
import { getNextColorIndex } from "../nexus-util"
import {
  updateAux1RouteBySample,
  updateAux2RouteBySample,
  updateAux3RouteBySample,
  updateChannelBySample,
} from "../parameter-updates"

export const createMachinisteMixerChannels = (
  t: SafeTransactionBuilder,
  { mixerMaster, ...props }: MixerEntities,
  existingEntities?: MachinisteMixerEntities,
): MachinisteMixerEntities => {
  // group
  const mixerGroup =
    existingEntities?.mixerGroup ??
    t.create("mixerGroup", {
      displayParameters: {
        displayName: "Drums (Technoract)",
        colorIndex: getNextColorIndex(),
        orderAmongStrips: 4,
      },
    })

  // channels
  const sampleMixerChannels: {
    [key in SampleKey]?: SampleMixerEntities
  } = existingEntities?.sampleMixerChannels ?? {}

  for (let i = 0; i < ORDERED_SAMPLE_KEYS.length; i++) {
    const sampleKey = ORDERED_SAMPLE_KEYS[i]
    sampleMixerChannels[sampleKey] = createMachinisteMixerChannel(
      t,
      {
        sampleKey,
        colorIndex: getNextColorIndex(),
        mixerGroup,
        mixerMaster,
        orderAmongStrips: i + 3,
        ...props,
      },
      sampleMixerChannels[sampleKey],
    )
  }

  return {
    mixerGroup,
    sampleMixerChannels: sampleMixerChannels as Required<
      typeof sampleMixerChannels
    >,
  }
}

export const createMachinisteMixerChannel = (
  t: SafeTransactionBuilder,
  {
    sampleKey,
    colorIndex,
    mixerGroup,
    orderAmongStrips,
    aux1,
    aux2,
    aux3,
  }: {
    sampleKey: SampleKey
    colorIndex: number
    mixerGroup: NexusEntity<"mixerGroup">
    orderAmongStrips: number
  } & MixerEntities,
  existingEntities?: SampleMixerEntities,
): SampleMixerEntities => {
  const channel =
    existingEntities?.channel ??
    t.create("mixerChannel", {
      displayParameters: {
        displayName: `${sampleKey} (Technoract)`,
        colorIndex,
        orderAmongStrips,
      },
    })
  updateChannelBySample(t, channel, sampleKey)
  const cable =
    existingEntities?.grouping ??
    t.create("mixerStripGrouping", {
      childStrip: channel.location,
      groupStrip: mixerGroup.location,
    })
  const aux1Route =
    existingEntities?.aux1Route ??
    t.create("mixerAuxRoute", {
      auxSend: channel.fields.auxSend.location,
      auxReceive: aux1.location,
      gain: 0,
    })
  updateAux1RouteBySample(t, aux1Route, sampleKey)
  const aux2Route =
    existingEntities?.aux2Route ??
    t.create("mixerAuxRoute", {
      auxSend: channel.fields.auxSend.location,
      auxReceive: aux2.location,
      gain: 0,
    })
  updateAux2RouteBySample(t, aux2Route, sampleKey)
  const aux3Route =
    existingEntities?.aux3Route ??
    t.create("mixerAuxRoute", {
      auxSend: channel.fields.auxSend.location,
      auxReceive: aux3.location,
      gain: 0,
    })
  updateAux3RouteBySample(t, aux3Route, sampleKey)

  return {
    channel,
    grouping: cable,
    aux1Route,
    aux2Route,
    aux3Route,
  }
}

export const createMachiniste = (
  t: SafeTransactionBuilder,
  props: MachinisteMixerEntities,
  existingEntities?: MachinisteEntities,
): MachinisteEntities => {
  const machiniste =
    existingEntities?.machiniste ??
    t.create("machiniste", {
      displayName: "Machiniste (Technoract)",
      positionX: -1000,
      positionY: 400,
    })

  const audioCables: {
    [key in SampleKey]?: NexusEntity<"desktopAudioCable">
  } = existingEntities?.audioCables ?? {}
  for (let i = 0; i < ORDERED_SAMPLE_KEYS.length; i++) {
    const fromSocket =
      machiniste.fields.channels.array.at(i)?.fields.channelOutput.location
    const toSocket =
      props.sampleMixerChannels[ORDERED_SAMPLE_KEYS[i]]?.channel.fields
        .audioInput.location

    if (fromSocket === undefined || toSocket === undefined) {
      continue
    }

    audioCables[ORDERED_SAMPLE_KEYS[i]] =
      audioCables[ORDERED_SAMPLE_KEYS[i]] ??
      t.create("desktopAudioCable", {
        fromSocket,
        toSocket,
      })
  }

  return {
    machiniste,
    audioCables: audioCables as Required<typeof audioCables>,
  }
}

export const createMachinisteGroupCompressor = (
  t: SafeTransactionBuilder,
  { mixerGroup }: { mixerGroup: NexusEntity<"mixerGroup"> },
  existingEntities?: MachinisteGroupCompressorEntities,
): MachinisteGroupCompressorEntities => {
  const gravity =
    existingEntities?.gravity ??
    t.create("gravity", {
      displayName: "Gravity (Technoract)",
      ratio: 11,
      thresholdDb: -17,
      positionX: -1000,
      positionY: -1000,
    })

  const audioCableIn =
    existingEntities?.audioCableIn ??
    t.create("desktopAudioCable", {
      fromSocket: mixerGroup.fields.insertOutput.location,
      toSocket: gravity.fields.audioInput.location,
    })

  const audioCableOut =
    existingEntities?.audioCableOut ??
    t.create("desktopAudioCable", {
      fromSocket: gravity.fields.audioOutput.location,
      toSocket: mixerGroup.fields.insertInput.location,
    })

  return { gravity, audioCableIn, audioCableOut }
}
