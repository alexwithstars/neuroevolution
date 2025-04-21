import { GameInterface } from '../game/playground'
import { randomInt, randomDouble, Position2d, layerLength, centerF, sigmoid } from '../misc/math'
import { NeatBrain } from './brain'
import { NETWORK_CONFIG } from './config'
import { MUTATIONS, NeuronType, type connectionId } from './network.d'
import { Agent } from './population'

class ConnectionGene {
  inN: number
  outN: number
  weight: number
  enabled: boolean
  innovation: number
  constructor (inN: number, outN: number, weight: number, innovation: number, enabled = true) {
    this.inN = inN
    this.outN = outN
    this.weight = weight
    this.enabled = enabled
    this.innovation = innovation
  }
}

class NeuronGene {
  id: number
  bias: number
  type: NeuronType
  constructor (id: number, bias: number, type: NeuronType) {
    this.id = id
    this.bias = bias
    this.type = type
  }
}

export class Genome {
  inputsNumber: number
  outputsNumber: number
  neuronGenes: Map<number, NeuronGene>
  connectionGenes: Map<number, ConnectionGene>
  counters: GenomeCounters
  distanceConf = NETWORK_CONFIG.DISTANCE_COEFOFFICIENTS
  mutationChance = NETWORK_CONFIG.MUTATION_CHANCE
  mutationMagnitude = NETWORK_CONFIG.MUTATION_MAGNITUDE
  mutationFunction = {
    [MUTATIONS.BIAS]: () => this.mutateBias(),
    [MUTATIONS.NEW_BIAS]: () => this.mutateBias(),
    [MUTATIONS.WEIGHT]: () => this.mutateWeight(),
    [MUTATIONS.NEW_WEIGHT]: () => this.mutateWeight(),
    [MUTATIONS.TOGGLE_CONNECTION]: () => this.mutateToggleConnection(),
    [MUTATIONS.NEW_CONNECTION]: () => this.mutateNewConnection(),
    [MUTATIONS.REMOVE_CONNECTION]: () => this.mutateRemoveConnection(),
    [MUTATIONS.NEW_NEURON]: () => this.mutateNewNeuron(),
    [MUTATIONS.REMOVE_NEURON]: () => this.mutateRemoveNeuron()
  }

  constructor (counters: GenomeCounters, inputsNumber: number, outputsNumber: number, feedForward: boolean = false) {
    this.counters = counters
    this.inputsNumber = inputsNumber
    this.outputsNumber = outputsNumber
    this.neuronGenes = new Map()
    this.connectionGenes = new Map()
    for (let i = 0; i < inputsNumber; i++) {
      this.addNeuronGene(i, NETWORK_CONFIG.INITIAL_BIAS, NeuronType.INPUT)
    }
    for (let i = 0; i < outputsNumber; i++) {
      this.addNeuronGene(i + inputsNumber, NETWORK_CONFIG.INITIAL_BIAS, NeuronType.OUTPUT)
    }
    if (!feedForward) return
    for (let i = 0; i < inputsNumber; i++) {
      for (let j = 0; j < outputsNumber; j++) {
        this.addConnectionGene(i, j + inputsNumber, NETWORK_CONFIG.INITIAL_WEIGHT)
      }
    }
  }

  addNeuronGene (id: number, bias: number, type: NeuronType = NeuronType.HIDDEN): void {
    const neuronGene = new NeuronGene(id, bias, type)
    this.neuronGenes.set(id, neuronGene)
  }

  addConnectionGene (inN: number, outN: number, weight: number, enabled = true): void {
    const innovationNumber = this.counters.getConnectionId(`${inN}->${outN}`)
    const connectionGene = new ConnectionGene(inN, outN, weight, innovationNumber, enabled)
    this.connectionGenes.set(innovationNumber, connectionGene)
  }

  crossover (recessive: Genome): Genome {
    const newGenome = new Genome(this.counters, this.inputsNumber, this.outputsNumber)
    const newNeuronsIds: Set<number> = new Set()
    for (const connection of this.connectionGenes.values()) {
      const recessiveConnection = recessive.connectionGenes.get(connection.innovation)
      let weight = connection.weight
      let enabled = connection.enabled
      if (recessiveConnection !== undefined) {
        const selectedGene = randomInt(0, 1) === 1 ? connection : recessiveConnection
        weight = selectedGene.weight
        enabled = selectedGene.enabled
      }
      newNeuronsIds.add(connection.inN)
      newNeuronsIds.add(connection.outN)
      newGenome.addConnectionGene(connection.inN, connection.outN, weight, enabled)
    }
    for (const neuronId of newNeuronsIds) {
      const dominantNeuron = this.neuronGenes.get(neuronId)
      const recessiveNeuron = recessive.neuronGenes.get(neuronId)
      if (dominantNeuron !== undefined && recessiveNeuron !== undefined) {
        const selectedNeuron = randomInt(0, 1) === 1 ? dominantNeuron : recessiveNeuron
        newGenome.addNeuronGene(neuronId, selectedNeuron.bias, selectedNeuron.type)
        continue
      }
      const selectedNeuron = dominantNeuron ?? recessiveNeuron
      if (selectedNeuron === undefined) throw new Error('Selected neuron is undefined')
      newGenome.addNeuronGene(neuronId, selectedNeuron.bias, selectedNeuron.type)
    }
    return newGenome
  }

  topologicalDistance (genome: Genome): number {
    let average = 0
    let equalConnections = 0
    let equalNeurons = 0
    for (const aConnection of this.connectionGenes.values()) {
      if (!genome.connectionGenes.has(aConnection.innovation)) continue
      const bConnection = genome.connectionGenes.get(aConnection.innovation)
      if (bConnection === undefined) throw new Error('Connection is undefined')
      average += Math.abs(aConnection.weight - bConnection.weight)
      equalConnections++
    }
    for (const aNeuron of this.neuronGenes.values()) {
      if (!genome.neuronGenes.has(aNeuron.id)) continue
      const bNeuron = genome.neuronGenes.get(aNeuron.id)
      if (bNeuron === undefined) throw new Error('Neuron is undefined')
      average += Math.abs(aNeuron.bias - bNeuron.bias)
      equalNeurons++
    }
    const maxLengthConnections = Math.max(this.connectionGenes.size, genome.connectionGenes.size)
    const maxLengthNeurons = Math.max(this.neuronGenes.size, genome.neuronGenes.size)
    const maxLength = maxLengthConnections + maxLengthNeurons
    const disjointConnections = this.connectionGenes.size + genome.connectionGenes.size - 2 * equalConnections
    const disjointNeurons = this.neuronGenes.size + genome.neuronGenes.size - 2 * equalNeurons
    const disjoint = disjointConnections + disjointNeurons
    average = average / (equalConnections + equalNeurons)
    return this.distanceConf.disjoint * disjoint / maxLength +
    this.distanceConf.average * average
  }

  mutate (): void {
    for (const mutation of Object.values(MUTATIONS)) {
      const can = randomDouble(0, 1) <= this.mutationChance[mutation]
      if (can) this.mutationFunction[mutation]()
    }
  }

  getRandomConnection (): ConnectionGene | undefined {
    const randomIdx = randomInt(0, this.connectionGenes.size - 1)
    return Array.from(this.connectionGenes.values())[randomIdx]
  }

  getRandomNeuron (): NeuronGene | undefined {
    const randomIdx = randomInt(0, this.neuronGenes.size - 1)
    return Array.from(this.neuronGenes.values())[randomIdx]
  }

  mutateWeight (): void {
    const connectionGene = this.getRandomConnection()
    if (connectionGene === undefined) return
    const magnitude = this.mutationMagnitude[MUTATIONS.WEIGHT]
    connectionGene.weight += randomDouble(-magnitude, magnitude)
  }

  mutateNewWeight (): void {
    const connectionGene = this.getRandomConnection()
    if (connectionGene === undefined) return
    const magnitude = this.mutationMagnitude[MUTATIONS.NEW_WEIGHT]
    connectionGene.weight = randomDouble(-magnitude, magnitude)
  }

  mutateBias (): void {
    const neuronGene = this.getRandomNeuron()
    if (neuronGene === undefined) return
    const magnitude = this.mutationMagnitude[MUTATIONS.BIAS]
    neuronGene.bias += randomDouble(-magnitude, magnitude)
  }

  mutateNewBias (): void {
    const magnitude = this.mutationMagnitude[MUTATIONS.NEW_BIAS]
    const neuronGene = this.getRandomNeuron()
    if (neuronGene === undefined) return
    neuronGene.bias = randomDouble(-magnitude, magnitude)
  }

  checkForCicle (inN: number, outN: number): boolean {
    if (inN === outN) return true
    const connectionGraph: Record<number, number[]> = {}
    for (const node of this.neuronGenes.values()) {
      connectionGraph[node.id] = []
    }
    for (const connection of this.connectionGenes.values()) {
      connectionGraph[connection.inN].push(connection.outN)
    }
    const queue = [outN]
    const visited = new Set()
    while (queue.length > 0) {
      const node = queue.shift()
      if (node === undefined) throw new Error('Node is undefined')
      for (const out of connectionGraph[node]) {
        if (out === inN) return true
        if (!visited.has(out)) {
          queue.push(out)
          visited.add(out)
        }
      }
    }
    return false
  }

  mutateNewConnection (): void {
    const inputNeurons = []
    const outputNeurons = []
    const hiddenNeurons = []
    for (const neuron of this.neuronGenes.values()) {
      if (neuron.type === NeuronType.INPUT) inputNeurons.push(neuron)
      if (neuron.type === NeuronType.OUTPUT) outputNeurons.push(neuron)
      if (neuron.type === NeuronType.HIDDEN) hiddenNeurons.push(neuron)
    }
    const newIn = randomInt(0, inputNeurons.length + hiddenNeurons.length - 1)
    const newOut = randomInt(0, outputNeurons.length + hiddenNeurons.length - 1)
    const inN = newIn < inputNeurons.length
      ? inputNeurons[newIn].id
      : hiddenNeurons[newIn - inputNeurons.length].id
    const outN = newOut < outputNeurons.length
      ? outputNeurons[newOut].id
      : hiddenNeurons[newOut - outputNeurons.length].id
    if (this.checkForCicle(inN, outN)) return
    const innovationNumber = this.counters.getConnectionId(`${inN}->${outN}`)
    if (this.connectionGenes.has(innovationNumber)) {
      const connection = this.connectionGenes.get(innovationNumber)
      if (connection === undefined) throw new Error('Connection is undefined')
      connection.enabled = true
    } else {
      this.addConnectionGene(inN, outN, NETWORK_CONFIG.INITIAL_WEIGHT)
    }
  }

  mutateRemoveConnection (): void {
    const connection = this.getRandomConnection()
    if (connection === undefined) return
    this.connectionGenes.delete(connection.innovation)
  }

  mutateToggleConnection (): void {
    const connection = this.getRandomConnection()
    if (connection === undefined) return
    connection.enabled = !connection.enabled
  }

  mutateNewNeuron (): void {
    const connection = this.getRandomConnection()
    if (connection === undefined) return
    const newNeuronId = this.counters.getNextNeuronId()
    this.addNeuronGene(newNeuronId, NETWORK_CONFIG.INITIAL_BIAS, NeuronType.HIDDEN)
    this.addConnectionGene(connection.inN, newNeuronId, NETWORK_CONFIG.INITIAL_WEIGHT)
    this.addConnectionGene(newNeuronId, connection.outN, connection.weight)
    connection.enabled = false
  }

  mutateRemoveNeuron (): void {
    const neuron = this.getRandomNeuron()
    if (neuron === undefined) return
    if (neuron.type !== NeuronType.HIDDEN) return
    for (const connection of Array.from(this.connectionGenes.values())) {
      if (connection.inN === neuron.id || connection.outN === neuron.id) {
        this.connectionGenes.delete(connection.innovation)
      }
    }
    this.neuronGenes.delete(neuron.id)
  }
}

export class GenomeCounters {
  neuronCounter: number
  connectionCounter: number
  connectionIds: Record<connectionId, number> = {}
  constructor (startNeuronId = 0, startConnectionId = 0) {
    this.neuronCounter = startNeuronId
    this.connectionCounter = startConnectionId
  }

  getConnectionId (connectionId: connectionId): number {
    if (this.connectionIds[connectionId] === undefined) {
      this.connectionIds[connectionId] = this.connectionCounter++
    }
    return this.connectionIds[connectionId]
  }

  getNextNeuronId (): number {
    return this.neuronCounter++
  }

  reset (startNeuronId = 0, startConnectionId = 0): void {
    this.neuronCounter = startNeuronId
    this.connectionCounter = startConnectionId
  }
}

export class Phenotype {
  genome: Genome
  brain: NeatBrain
  layers: number[][]
  renderMap: Map<number, Position2d>
  x: number
  y: number
  diameter: number = NETWORK_CONFIG.PHENOTYPE.DIAMETER
  radius: number = NETWORK_CONFIG.PHENOTYPE.DIAMETER / 2
  gap: number = NETWORK_CONFIG.PHENOTYPE.GAP
  constructor (agent: Agent, x = 0, y = 0) {
    this.genome = agent.genome
    this.brain = agent.brain
    this.x = x
    this.y = y
    this.renderMap = new Map()

    const inverseConnectionGraph: Record<number, number[]> = {}
    const outputIds: number[] = []
    const inputIds: number[] = []
    const hiddenIds: number[] = []
    for (const neuron of this.genome.neuronGenes.values()) {
      inverseConnectionGraph[neuron.id] = []
      if (neuron.type === NeuronType.OUTPUT) outputIds.push(neuron.id)
      if (neuron.type === NeuronType.INPUT) inputIds.push(neuron.id)
      if (neuron.type === NeuronType.HIDDEN) hiddenIds.push(neuron.id)
    }
    for (const connection of this.genome.connectionGenes.values()) {
      inverseConnectionGraph[connection.outN].push(connection.inN)
    }

    const depthMap: Record<number, number> = {}
    let maxDepth = -1
    const setDepth = (neuronId: number, depth: number): void => {
      for (const out of inverseConnectionGraph[neuronId]) {
        if (inputIds.includes(out)) continue
        setDepth(out, depth + 1)
      }
      if (depth === -1) return
      if (depthMap[neuronId] === undefined) depthMap[neuronId] = 0
      depthMap[neuronId] = Math.max(depthMap[neuronId], depth)
      maxDepth = Math.max(maxDepth, depth)
    }
    for (const neuronId of outputIds) {
      setDepth(neuronId, -1)
    }

    this.layers = Array(maxDepth + 1).fill(null).map(() => [])
    for (const neuronId of hiddenIds) {
      if (depthMap[neuronId] === undefined) continue
      this.layers[depthMap[neuronId]].push(neuronId)
    }
    this.layers.reverse()
    this.layers.unshift(inputIds)
    this.layers.push(outputIds)

    const maxLayerLength = Math.max(...this.layers.map((layer) => layer.length))
    const maxHeight = layerLength(maxLayerLength, this.diameter, this.gap)
    for (let i = 0; i < this.layers.length; i++) {
      const layerHeight = layerLength(this.layers[i].length, this.diameter, this.gap)
      const layerStartHeight = (maxHeight - layerHeight) / 2
      const nx = centerF(i + 1, this.diameter, this.gap * 4)
      if (nx < 0) throw new Error(`Negative x ${this.diameter}, ${i}`)
      for (let j = 0; j < this.layers[i].length; j++) {
        const neuronId = this.layers[i][j]
        const ny = layerStartHeight + centerF(j + 1, this.diameter, this.gap)
        this.renderMap.set(neuronId, new Position2d(nx + this.x, ny + this.y))
      }
    }
  }

  render (context: CanvasRenderingContext2D): void {
    for (const connection of this.genome.connectionGenes.values()) {
      if (!connection.enabled) continue
      const inputPosition = this.renderMap.get(connection.inN)
      const outputPosition = this.renderMap.get(connection.outN)
      if (inputPosition === undefined || outputPosition === undefined) continue
      const value = this.brain.network[connection.inN].value
      const hue = sigmoid(value * connection.weight) * 120
      const width = sigmoid(value * connection.weight) * 4 + 0.5
      context.strokeStyle = `hsl(${hue}, 100%, 50%)`
      context.lineWidth = width
      context.beginPath()
      context.moveTo(inputPosition.x, inputPosition.y)
      context.lineTo(outputPosition.x, outputPosition.y)
      context.stroke()
      context.closePath()
    }
    for (const neuron of this.genome.neuronGenes.values()) {
      const position = this.renderMap.get(neuron.id)
      const value = this.brain.network[neuron.id].value
      const hue = sigmoid(value) * 120
      if (position === undefined) continue

      context.fillStyle = '#fff'
      context.beginPath()
      context.arc(position.x, position.y, this.radius, 0, 2 * Math.PI)
      context.fill()
      context.closePath()

      context.fillStyle = `hsl(${hue}, 100%, 50%)`
      context.beginPath()
      context.arc(position.x, position.y, this.radius * 0.8, 0, 2 * Math.PI)
      context.fill()
      context.closePath()

      context.font = '10px Arial'
      context.fillStyle = '#000'
      context.fillText(neuron.id.toString(), position.x - this.radius / 2, position.y + this.radius / Math.PI)
    }

    context.fillStyle = '#fff'
    context.font = '12px Arial'
    let i = 0
    for (const name of GameInterface.fixedNames) {
      context.fillText(`${i}: ${name}`, 10, 290 + 15 * i)
      i++
    }
  }
}
