import type { activationFunction, inputSource, outputTarget } from './network.d'
import type { Genome } from './genome'
import { NeuronType } from './network.d'
import { NETWORK_CONFIG } from './config'

export class Neuron {
  bias: number
  outputs: Connection[]
  value: number
  activationFunction: activationFunction
  constructor (bias: number, activationFunction: activationFunction, outputConnections: Connection[] = []) {
    this.bias = bias
    this.outputs = outputConnections
    this.activationFunction = activationFunction
    this.value = 0
  }

  addInputValue (value: number): void {
    this.value += value
  }

  addOutputConnection (connection: Connection): void {
    this.outputs.push(connection)
  }

  activate (): void {
    this.value += this.bias
    this.value = this.activationFunction(this.value)
    for (const output of this.outputs) {
      output.addInput(this.value)
    }
  }

  getOutput (): number {
    return this.value
  }
}

export class InputNeuron extends Neuron {
  inputSource: inputSource
  constructor (bias: number, inputSource: inputSource) {
    super(bias, NETWORK_CONFIG.ACTIVATION_FUNCTION[NeuronType.INPUT])
    this.inputSource = inputSource
  }

  activate (): void {
    this.value = this.inputSource()
    super.activate()
  }
}

export class OutputNeuron extends Neuron {
  outputTarget: outputTarget
  constructor (bias: number, outputTarget: outputTarget) {
    super(bias, NETWORK_CONFIG.ACTIVATION_FUNCTION[NeuronType.OUTPUT])
    this.outputTarget = outputTarget
  }

  activate (): void {
    super.activate()
    this.outputTarget(this.value)
  }
}

export class Connection {
  weight: number
  target: Neuron
  constructor (weight: number, target: Neuron) {
    this.weight = weight
    this.target = target
  }

  addInput (value: number): void {
    this.target.addInputValue(this.weight * value)
  }
}

export class NeatBrain {
  inputSources: inputSource[]
  outputTargets: outputTarget[]
  genome: Genome
  network: Record<number, Neuron | InputNeuron | OutputNeuron>
  order: number[]
  constructor (inputSources: inputSource[], outputTargets: outputTarget[], genome: Genome) {
    this.inputSources = inputSources
    this.outputTargets = outputTargets
    this.genome = genome
    this.network = {}
    this.order = []
    const inputNeuronsId = []
    const outputNeuronsId = []
    const visited: Set<number> = new Set()
    const inverseConnectionGraph: Record<number, number[]> = {}
    for (const node of this.genome.neuronGenes.values()) {
      inverseConnectionGraph[node.id] = []
      if (node.type === NeuronType.INPUT) {
        this.network[node.id] = new InputNeuron(node.bias, this.inputSources[node.id])
        inputNeuronsId.push(node.id)
      } else if (node.type === NeuronType.OUTPUT) {
        this.network[node.id] = new OutputNeuron(node.bias, this.outputTargets[node.id - this.genome.inputsNumber])
        outputNeuronsId.push(node.id)
      } else {
        this.network[node.id] = new Neuron(node.bias, NETWORK_CONFIG.ACTIVATION_FUNCTION[NeuronType.HIDDEN])
      }
    }
    for (const connection of this.genome.connectionGenes.values()) {
      if (connection.enabled) {
        inverseConnectionGraph[connection.outN].push(connection.inN)
        const newConnection = new Connection(connection.weight, this.network[connection.outN])
        this.network[connection.inN].addOutputConnection(newConnection)
      }
    }

    const createOrder = (neuronId: number): void => {
      for (const out of inverseConnectionGraph[neuronId]) {
        if (!visited.has(out)) {
          visited.add(out)
          createOrder(out)
        }
      }
      this.order.push(neuronId)
    }

    for (const neuronId of outputNeuronsId) {
      createOrder(neuronId)
    }
  }

  activate (): void {
    for (const neuronId of this.order) {
      this.network[neuronId].value = 0
    }
    for (const neuronId of this.order) {
      this.network[neuronId].activate()
    }
  }
}
