import z from "zod"
import { ORDERED_SAMPLE_KEYS } from "./const"
import {
  AuxDelayEntitiesSchema,
  AuxFlangerEntitiesSchema,
  AuxReverbEntitiesSchema,
  BassEntitiesSchema,
  ChordEntitiesSchema,
  MachinisteEntitiesSchema,
  MachinisteGroupCompressorEntitiesSchema,
  MachinisteMidiEntitiesSchema,
  MachinisteMixerEntitiesSchema,
  MasterInsertEntitiesSchema,
  MidiEntitiesSchema,
  MixerEntitiesSchema,
  PadEntitiesSchema,
  SampleMixerEntitiesSchema,
  TechnoStateSchema,
} from "./schemas"

export type SampleKey = (typeof ORDERED_SAMPLE_KEYS)[number]

export type RandomMethod = "probability" | "randomPattern"

export type PromiseResolvedType<T> = T extends Promise<infer R> ? R : never

export type SampleMixerEntities = z.infer<typeof SampleMixerEntitiesSchema>

export type MachinisteMixerEntities = z.infer<
  typeof MachinisteMixerEntitiesSchema
>

export type MixerEntities = z.infer<typeof MixerEntitiesSchema>

export type MachinisteEntities = z.infer<typeof MachinisteEntitiesSchema>

export type MachinisteGroupCompressorEntities = z.infer<
  typeof MachinisteGroupCompressorEntitiesSchema
>

export type AuxDelayEntities = z.infer<typeof AuxDelayEntitiesSchema>

export type AuxFlangerEntities = z.infer<typeof AuxFlangerEntitiesSchema>

export type AuxReverbEntities = z.infer<typeof AuxReverbEntitiesSchema>

export type MasterInsertEntities = z.infer<typeof MasterInsertEntitiesSchema>

export type BassEntities = z.infer<typeof BassEntitiesSchema>

export type PadEntities = z.infer<typeof PadEntitiesSchema>

export type ChordEntities = z.infer<typeof ChordEntitiesSchema>

export type MidiEntities = z.infer<typeof MidiEntitiesSchema>

export type MachinisteMidiEntities = z.infer<
  typeof MachinisteMidiEntitiesSchema
>

export type TechnoState = z.infer<typeof TechnoStateSchema>

export type SerializedEntity = { entityType: string; id: string }
