import type {
  NexusEntity,
  NexusObject,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import type { MachinisteChannel } from "@audiotool/nexus/entities"
import type { SampleKey } from "../types"

export const updateMachinisteChannelsBySample = (
  t: SafeTransactionBuilder,
  channel: NexusObject<MachinisteChannel>,
  key: SampleKey,
) => {
  t.update(channel.fields.gain, 0)
  t.update(channel.fields.startTrimModulationDepth, 0)
  switch (key) {
    case "kick":
      t.update(channel.fields.envelopeSlope, 0.5)
      t.update(channel.fields.endTrimFactor, 0.66)
      t.update(channel.fields.gainModulationDepth, 0.5)
      break
    case "closed_hat":
      t.update(channel.fields.envelopeSlope, 0.4)
      t.update(channel.fields.startTrimFactor, 0.1)
      t.update(channel.fields.pitchSemitones, 0.4)
      break
    case "twig":
      t.update(channel.fields.startTrimFactor, 0.09)
      t.update(channel.fields.pitchSemitones, 0.17)
      t.update(channel.fields.filterTypeIndex, 3)
      t.update(channel.fields.cutoffFrequencyHz, 9007)
      break
    case "shaker":
      t.update(channel.fields.panning, 0.1)
      t.update(channel.fields.pitchSemitones, 0.55)
      t.update(channel.fields.gainModulationDepth, 0.6)
      t.update(channel.fields.envelopeSlope, Math.random())
      break
    case "clap":
      t.update(channel.fields.endTrimFactor, 0.25)
      t.update(channel.fields.envelopeSlope, -1)
      break
    case "ride":
      t.update(channel.fields.endTrimFactor, 0.125)
      t.update(channel.fields.envelopeSlope, -0.75)
      break
    case "open_hat":
      t.update(channel.fields.filterTypeIndex, 3)
      t.update(channel.fields.cutoffFrequencyHz, 9000)
      t.update(channel.fields.gainModulationDepth, 0.06)
      t.update(channel.fields.envelopeSlope, Math.random())
      break
    default:
      key satisfies never
  }
}

export const updateChannelBySample = (
  t: SafeTransactionBuilder,
  channel: NexusEntity<"mixerChannel">,
  key: SampleKey,
) => {
  t.update(channel.fields.preGain, 1)
  switch (key) {
    case "kick":
      t.update(channel.fields.eq.fields.lowShelfGainDb, 7)
      t.update(channel.fields.preGain, 0.25)
      break
    case "closed_hat":
      break
    case "twig":
      t.update(channel.fields.preGain, 0.125)
      break
    case "shaker":
      t.update(channel.fields.preGain, 0.33)
      break
    case "clap":
      t.update(channel.fields.preGain, 0.66)
      break
    case "ride":
      t.update(channel.fields.preGain, 0.05)
      break
    case "open_hat":
      t.update(channel.fields.compressor.fields.isActive, true)
      t.update(channel.fields.compressor.fields.ratio, 29.7)
      t.update(channel.fields.compressor.fields.thresholdDb, -43)
      break
    default:
      key satisfies never
  }
}

export const updateAux1RouteBySample = (
  t: SafeTransactionBuilder,
  aux: NexusEntity<"mixerAuxRoute">,
  key: SampleKey,
) => {
  switch (key) {
    case "kick":
      break
    case "closed_hat":
      break
    case "twig":
      break
    case "shaker":
      t.update(aux.fields.gain, 0.1)
      break
    case "clap":
      break
    case "ride":
      break
    case "open_hat":
      t.update(aux.fields.gain, 0.06)
      break
    default:
      key satisfies never
  }
}

export const updateAux2RouteBySample = (
  t: SafeTransactionBuilder,
  aux: NexusEntity<"mixerAuxRoute">,
  key: SampleKey,
) => {
  t.update(aux.fields.gain, 0)
  switch (key) {
    case "kick":
      break
    case "closed_hat":
      t.update(aux.fields.gain, 1)
      break
    case "twig":
      t.update(aux.fields.gain, 0.5)
      break
    case "shaker":
      break
    case "clap":
      t.update(aux.fields.gain, 0.3)
      break
    case "ride":
      break
    case "open_hat":
      break
    default:
      key satisfies never
  }
}

export const updateAux3RouteBySample = (
  t: SafeTransactionBuilder,
  aux: NexusEntity<"mixerAuxRoute">,
  key: SampleKey,
) => {
  switch (key) {
    case "kick":
      break
    case "closed_hat":
      t.update(aux.fields.gain, 0.06)
      break
    case "twig":
      break
    case "shaker":
      t.update(aux.fields.gain, 0.03)
      break
    case "clap":
      t.update(aux.fields.gain, 0.06)
      break
    case "ride":
      t.update(aux.fields.gain, 0.33)
      break
    case "open_hat":
      t.update(aux.fields.gain, 0.06)
      break
    default:
      key satisfies never
  }
}

export const updateFlanger = (
  t: SafeTransactionBuilder,
  flanger: NexusEntity<"stompboxFlanger">,
) => {
  t.update(flanger.fields.lfoFrequencyHz, 0.2 + Math.random())
}

export const updateBass = (
  t: SafeTransactionBuilder,
  pulverisateur: NexusEntity<"pulverisateur">,
) => {
  t.update(
    pulverisateur.fields.filter.fields.cutoffFrequencyHz,
    150 + Math.random() * 50,
  )
  t.update(
    pulverisateur.fields.filter.fields.resonance,
    0.33 + Math.random() * 0.5,
  )
  t.update(
    pulverisateur.fields.amplitudeEnvelope.fields.sustainFactor,
    Math.random(),
  )
  t.update(pulverisateur.fields.lfo.fields.waveform, Math.random())
  t.update(
    pulverisateur.fields.lfo.fields.rateNormalized,
    0.33 + Math.random() * 0.3,
  )
}

export const updateBassPulsar = (
  t: SafeTransactionBuilder,
  pulsar: NexusEntity<"pulsar">,
) => {
  const delayTime = 2 + Math.round(Math.random() * 4)
  t.update(pulsar.fields.preDelayLeftTimeSemibreveIndex, delayTime)
  t.update(pulsar.fields.feedbackDelayTimeSemibreveIndex, delayTime)
}

export const updatePad = (
  t: SafeTransactionBuilder,
  pulverisateur: NexusEntity<"pulverisateur">,
) => {
  t.update(
    pulverisateur.fields.oscillatorA.fields.oscillator.fields.waveform,
    0.75 + Math.random() * 0.25,
  )
  t.update(
    pulverisateur.fields.oscillatorB.fields.oscillator.fields.waveform,
    0.75 + Math.random() * 0.25,
  )

  // detune
  const detuneAmount = Math.round(Math.random() * 25) / 1000
  t.update(
    pulverisateur.fields.oscillatorA.fields.oscillator.fields.tuneSemitones,
    -detuneAmount,
  )
  t.update(
    pulverisateur.fields.oscillatorB.fields.oscillator.fields.tuneSemitones,
    detuneAmount,
  )

  // sustain
  t.update(
    pulverisateur.fields.amplitudeEnvelope.fields.sustainFactor,
    Math.random(),
  )
  t.update(
    pulverisateur.fields.filterEnvelope.fields.sustainFactor,
    Math.random(),
  )

  // lfo
  t.update(
    pulverisateur.fields.lfo.fields.modulationDepth,
    Math.random() * 0.33,
  )
  t.update(pulverisateur.fields.lfo.fields.waveform, Math.random() * 0.33)
  t.update(
    pulverisateur.fields.lfo.fields.rateNormalized,
    0.33 + Math.random() * 0.1,
  )
}
