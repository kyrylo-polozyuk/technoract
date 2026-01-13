import type { EntityTypeKey, NexusEntity } from "@audiotool/nexus/document"
import z from "zod"
import { ORDERED_SAMPLE_KEYS } from "./const"

export const getEntitySchema = <T extends EntityTypeKey>(type: T) =>
  z.custom<NexusEntity<typeof type>>(
    (entity): entity is NexusEntity<typeof type> => {
      return (
        entity != null &&
        typeof entity === "object" &&
        "entityType" in entity &&
        "id" in entity &&
        entity.entityType === type &&
        typeof entity.id === "string"
      )
    },
  )

export const SampleMixerEntitiesSchema = z.object({
  channel: getEntitySchema("mixerChannel"),
  grouping: getEntitySchema("mixerStripGrouping"),
  aux1Route: getEntitySchema("mixerAuxRoute"),
  aux2Route: getEntitySchema("mixerAuxRoute"),
  aux3Route: getEntitySchema("mixerAuxRoute"),
})

export const MachinisteMixerEntitiesSchema = z.object({
  mixerGroup: getEntitySchema("mixerGroup"),
  sampleMixerChannels: z.record(
    z.enum(ORDERED_SAMPLE_KEYS),
    SampleMixerEntitiesSchema,
  ),
})

export const MixerEntitiesSchema = z.object({
  mixerMaster: getEntitySchema("mixerMaster"),
  aux1: getEntitySchema("mixerAux"),
  aux2: getEntitySchema("mixerAux"),
  aux3: getEntitySchema("mixerAux"),
})

export const MachinisteEntitiesSchema = z.object({
  machiniste: getEntitySchema("machiniste"),
  audioCables: z.record(
    z.enum(ORDERED_SAMPLE_KEYS),
    getEntitySchema("desktopAudioCable"),
  ),
})

export const MachinisteGroupCompressorEntitiesSchema = z.object({
  gravity: getEntitySchema("gravity"),
  audioCableIn: getEntitySchema("desktopAudioCable"),
  audioCableOut: getEntitySchema("desktopAudioCable"),
})

export const AuxDelayEntitiesSchema = z.object({
  pulsar: getEntitySchema("pulsar"),
  audioCableIn: getEntitySchema("desktopAudioCable"),
  audioCableOut: getEntitySchema("desktopAudioCable"),
})

export const AuxFlangerEntitiesSchema = z.object({
  flanger: getEntitySchema("stompboxFlanger"),
  panorama: getEntitySchema("panorama"),
  audioCableFlangerIn: getEntitySchema("desktopAudioCable"),
  audioCablePanoramaIn: getEntitySchema("desktopAudioCable"),
  audioCablePanoramaOut: getEntitySchema("desktopAudioCable"),
})

export const AuxReverbEntitiesSchema = z.object({
  quasar: getEntitySchema("quasar"),
  audioCableIn: getEntitySchema("desktopAudioCable"),
  audioCableOut: getEntitySchema("desktopAudioCable"),
})

export const MasterInsertEntitiesSchema = z.object({
  curve: getEntitySchema("curve"),
  quantum: getEntitySchema("quantum"),
  audioCableCurveIn: getEntitySchema("desktopAudioCable"),
  audioCableQuantumIn: getEntitySchema("desktopAudioCable"),
  audioCableQuantumOut: getEntitySchema("desktopAudioCable"),
})

export const BassEntitiesSchema = z.object({
  channel: getEntitySchema("mixerChannel"),
  auxRoute: getEntitySchema("mixerAuxRoute"),
  sideChainRoute: getEntitySchema("mixerSideChainCable"),
  pulverisateur: getEntitySchema("pulverisateur"),
  pulsar: getEntitySchema("pulsar"),
  audioCablePulsarIn: getEntitySchema("desktopAudioCable"),
  audioCablePulsarOut: getEntitySchema("desktopAudioCable"),
})

export const PadEntitiesSchema = z.object({
  channel: getEntitySchema("mixerChannel"),
  sideChainRoute: getEntitySchema("mixerSideChainCable"),
  pulverisateur: getEntitySchema("pulverisateur"),
  phaser: getEntitySchema("stompboxPhaser"),
  chorus: getEntitySchema("stompboxChorus"),
  pulsar: getEntitySchema("pulsar"),
  quasar: getEntitySchema("quasar"),
  audioCablePhaserIn: getEntitySchema("desktopAudioCable"),
  audioCableChorusIn: getEntitySchema("desktopAudioCable"),
  audioCablePulsarIn: getEntitySchema("desktopAudioCable"),
  audioCableQuasarIn: getEntitySchema("desktopAudioCable"),
  audioCableQuasarOut: getEntitySchema("desktopAudioCable"),
})

export const ChordEntitiesSchema = z.object({
  channel: getEntitySchema("mixerChannel"),
  sideChainRoute: getEntitySchema("mixerSideChainCable"),
  pulverisateur: getEntitySchema("pulverisateur"),
  phaser: getEntitySchema("stompboxPhaser"),
  panorama: getEntitySchema("panorama"),
  chorus: getEntitySchema("stompboxChorus"),
  gravity: getEntitySchema("gravity"),
  pulsar: getEntitySchema("pulsar"),
  audioCablePhaserIn: getEntitySchema("desktopAudioCable"),
  audioCablaPanoramaIn: getEntitySchema("desktopAudioCable"),
  audioCableChorusIn: getEntitySchema("desktopAudioCable"),
  audioCablePulsarIn: getEntitySchema("desktopAudioCable"),
  audioCableGravityIn: getEntitySchema("desktopAudioCable"),
  audioCablePulsarOut: getEntitySchema("desktopAudioCable"),
})

export const MidiEntitiesSchema = z.object({
  track: getEntitySchema("noteTrack"),
  region: getEntitySchema("noteRegion"),
  collection: getEntitySchema("noteCollection"),
  notes: z.array(getEntitySchema("note")),
})

export const MachinisteMidiEntitiesSchema = z.object({
  tracksAndRegions: z.record(z.enum(ORDERED_SAMPLE_KEYS), MidiEntitiesSchema),
})

export const TechnoStateSchema = z.object({
  config: getEntitySchema("config"),
  mixerEntities: MixerEntitiesSchema,
  machinisteMixerEntities: MachinisteMixerEntitiesSchema,
  machinisteEntities: MachinisteEntitiesSchema,
  machinisteGroupCompressorEntities: MachinisteGroupCompressorEntitiesSchema,
  auxDelayEntities: AuxDelayEntitiesSchema,
  auxFlangerEntities: AuxFlangerEntitiesSchema,
  auxReverbEntities: AuxReverbEntitiesSchema,
  masterInsertEntities: MasterInsertEntitiesSchema,
  bassEntities: BassEntitiesSchema,
  bassMidiEntities: MidiEntitiesSchema,
  machinisteMidiEntities: MachinisteMidiEntitiesSchema,
  padEntities: PadEntitiesSchema,
  padMidiEntities: MidiEntitiesSchema,
  rootNote: z.number(),
})
