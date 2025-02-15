export type inputSource = () => number
export type outputTarget = (value: number) => void
export type activationFunction = (value: number) => number

export const enum NeuronType {
  INPUT,
  HIDDEN,
  OUTPUT
}

export enum MUTATIONS {
  BIAS = 'BAS',
  NEW_BIAS = 'NWB',
  WEIGHT = 'WGT',
  NEW_WEIGHT = 'NWT',
  TOGGLE_CONNECTION = 'TGC',
  NEW_NEURON = 'NWN',
  REMOVE_NEURON = 'RMN',
  NEW_CONNECTION = 'NWC',
  REMOVE_CONNECTION = 'RMC'
}

export interface NETWORK_CONFIG_INTERFACE {
  SIZE: number
  SURVIVAL_RATE: number
  SPECIES_THRESHOLD: number
  INITIAL_BIAS: number
  INITIAL_WEIGHT: number
  START_FEED_FORWARD: boolean
  DISTANCE_COEFOFFICIENTS: {
    disjoint: number
    average: number
  }
  ACTIVATION_FUNCTION: {
    [NeuronType.INPUT]: activationFunction
    [NeuronType.HIDDEN]: activationFunction
    [NeuronType.OUTPUT]: activationFunction
  }
  MUTATION_CHANCE: Record<MUTATIONS, number>
  MUTATION_MAGNITUDE: {
    [MUTATIONS.BIAS]: number
    [MUTATIONS.NEW_BIAS]: number
    [MUTATIONS.WEIGHT]: number
    [MUTATIONS.NEW_WEIGHT]: number
  }
  PHENOTYPE: {
    DIAMETER: number
    GAP: number
  }
}

export type connectionId = `${number}->${number}`
