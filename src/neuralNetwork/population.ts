import { Game, GameInterface, Playground } from '../game/playground'
import { GameRenderer } from '../render/game'
import { NETWORK_CONFIG } from './config'
import { GAME_CONFIG } from '../game/config'
import { Genome, GenomeCounters } from './genome'
import { randomInt } from '../misc/math'
import { NeatBrain } from './brain'
import { delay } from '../misc/utils'
import { TrainningRenderer } from '../render/trainning'

export class Agent {
  id: string
  genome: Genome
  game: Game
  fitness: number
  adjustedFitness: number
  brain: NeatBrain
  specieId: string | null
  constructor (genome: Genome, game: Game) {
    this.id = crypto.randomUUID()
    this.specieId = null
    this.genome = genome
    this.game = game
    this.fitness = 0
    this.adjustedFitness = 0
    const gameInterface = new GameInterface(this.game)
    this.brain = new NeatBrain(
      gameInterface.inputs,
      gameInterface.outputs,
      this.genome
    )
  }

  think (): void {
    this.brain.activate()
  }

  crossover (recessive: Agent): Genome {
    return this.genome.crossover(recessive.genome)
  }

  mutate (): void {
    this.genome.mutate()
    this.brain = new NeatBrain(
      this.brain.inputSources,
      this.brain.outputTargets,
      this.genome
    )
  }
}

class Specie {
  members: Map<string, Agent>
  representative: Agent
  id: string
  constructor (representative: Agent) {
    this.id = crypto.randomUUID()
    this.members = new Map()
    this.addMember(representative)
    this.representative = representative
  }

  getRandomMember (): Agent | undefined {
    return Array.from(this.members.values())[randomInt(0, this.length - 1)]
  }

  resetSpecie (): void {
    const randomAgent = this.getRandomMember()
    if (randomAgent !== undefined) this.representative = randomAgent
    this.members = new Map()
  }

  checkDistance (candidate: Agent): number {
    return this.representative.genome.topologicalDistance(candidate.genome)
  }

  addMember (member: Agent): void {
    member.specieId = this.id
    this.members.set(member.id, member)
  }

  removeMember (member: Agent): void {
    member.specieId = null
    this.members.delete(member.id)
  }

  getAverageFitness (): number {
    let sum = 0
    for (const member of this.members.values()) {
      sum += member.fitness
    }
    return sum / this.length
  }

  get length (): number {
    return this.members.size
  }
}

export class Population {
  counters: GenomeCounters
  games: Game[]
  agents: Map<string, Agent>
  species: Map<string, Specie>
  threshold: number = NETWORK_CONFIG.SPECIES_THRESHOLD
  survivalRate: number = NETWORK_CONFIG.SURVIVAL_RATE
  playground: Playground
  generation: number
  avgFitness: number
  next: boolean
  running: boolean
  progress: number
  activeRenderer: GameRenderer | null
  trainingRenderer: TrainningRenderer
  raf: number
  constructor (trainingRenderer: TrainningRenderer) {
    this.trainingRenderer = trainingRenderer
    const populationNumber = NETWORK_CONFIG.SIZE
    this.playground = new Playground(GAME_CONFIG.TOTAL_TIME, GAME_CONFIG.PHYSICS_FREQUENCY, GAME_CONFIG.SIMULATED_SECONDS)
    const gameInterface = new GameInterface(new Game(200, 200))
    const inputsNumber = gameInterface.inputs.length
    const outputsNumber = gameInterface.outputs.length
    this.counters = new GenomeCounters(inputsNumber + outputsNumber, 0)
    this.agents = new Map()
    this.species = new Map()
    this.games = []
    this.generation = 0
    this.avgFitness = 0
    this.next = false
    this.running = false
    this.progress = 0
    this.activeRenderer = null
    this.raf = -1
    let newSpecie: Specie | null = null
    for (let i = 0; i < populationNumber; i++) {
      const newGame = new Game(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)
      const newGenome = new Genome(this.counters, inputsNumber, outputsNumber, NETWORK_CONFIG.START_FEED_FORWARD)
      const newAgent = new Agent(newGenome, newGame)
      this.agents.set(newAgent.id, newAgent)
      this.games.push(newGame)
      if (i === 0) {
        newSpecie = new Specie(newAgent)
        this.species.set(newSpecie.id, newSpecie)
      }
      if (newSpecie === null) throw new Error('This should not happen')
      newSpecie.addMember(newAgent)
    }
  }

  async toggleTraining (): Promise<void> {
    if (this.activeRenderer !== null) return
    this.next = !this.next
    if (this.next && !this.running) {
      this.trainingRenderer.renderInfo()
      await delay(100)
      this.training()
    }
    this.trainingRenderer.renderProgress()
  }

  async training (): Promise<void> {
    this.running = true
    while (this.next) {
      this.generation++
      if (this.generation !== 1) {
        this.select()
        this.repoblate()
      }
      this.mutate()
      this.speciate()
      await this.evaluate()
      this.updateStats()
      this.trainingRenderer.renderInfo()
      await delay(1000)
    }
    this.running = false
  }

  toggleGameRender (): boolean {
    if (this.activeRenderer !== null) {
      this.activeRenderer.stop()
      this.activeRenderer = null
      return false
    }
    if (!this.running) {
      const agents = Array.from(this.agents.values())
      agents.sort((a, b) => b.fitness - a.fitness)
      const agent = agents[0]
      if (agent === undefined) throw new Error('This should not happen')
      this.renderGame(agent)
      return true
    }
    return false
  }

  renderGame (agent: Agent): void {
    agent.game.reset()
    this.activeRenderer = new GameRenderer(agent.game, GAME_CONFIG.PHYSICS_FREQUENCY, agent)
    this.activeRenderer.start()
  }

  updateStats (): void {
    this.avgFitness = 0
    for (const agent of this.agents.values()) {
      this.avgFitness += agent.fitness
    }
    this.avgFitness /= this.agents.size
  }

  async evaluate (): Promise<void> {
    this.progress = 0
    return new Promise(resolve => {
      this.resetGames()
      const iterator = this.agents.values()
      const evaluationStep = (): void => {
        const { value: agent, done } = iterator.next()
        if (done ?? true) return resolve()
        if (agent === undefined) throw new Error('This should not happen')
        this.playground.evaluate(agent, agent.game)
        this.progress += 100 / NETWORK_CONFIG.SIZE
        this.trainingRenderer.renderProgress()
        this.raf = requestAnimationFrame(() => evaluationStep())
      }
      this.raf = requestAnimationFrame(() => evaluationStep())
    })
  }

  resetGames (): void {
    for (const game of this.games) {
      game.reset()
    }
  }

  repoblate (): void {
    const orderedSpecies = new Map()
    const candidatesIds = Array.from(this.agents.keys())
    let sum = 0
    for (const specie of this.species.values()) {
      const average = specie.getAverageFitness()
      sum += average
      orderedSpecies.set(specie.id, average)
    }
    let index = 0
    while (index < NETWORK_CONFIG.SIZE) {
      for (const [specieId, specieFitness] of orderedSpecies.entries()) {
        if (index >= NETWORK_CONFIG.SIZE) break
        let agentsNumber = Math.ceil((specieFitness / sum) * NETWORK_CONFIG.SIZE)
        const specie = this.species.get(specieId)
        if (specie === undefined) throw new Error('Specie is undefined')
        const agents = Array.from(specie.members.values())
        if (agents.length < 2) {
          this.crossover(agents[0], agents[0], index++)
          continue
        }
        agents.sort((a, b) => b.fitness - a.fitness)
        while (agentsNumber > 0 && index < NETWORK_CONFIG.SIZE) {
          for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
              this.crossover(agents[i], agents[j], index++)
              if (--agentsNumber <= 0 || index >= NETWORK_CONFIG.SIZE) break
            }
            if (agentsNumber <= 0 || index >= NETWORK_CONFIG.SIZE) break
          }
        }
      }
    }
    for (const agentId of candidatesIds) {
      const agent = this.agents.get(agentId)
      if (agent === undefined) throw new Error('Agent is undefined')
      this.removeAgent(agent)
    }
  }

  removeAgent (agent: Agent): void {
    this.agents.delete(agent.id)
    if (agent.specieId === null) return
    const agentSpecie = this.species.get(agent.specieId)
    if (agentSpecie === undefined) throw new Error('Agent specie is undefined')
    agentSpecie.removeMember(agent)
  }

  select (): void {
    for (const specie of this.species.values()) {
      for (const agent of specie.members.values()) {
        agent.adjustedFitness = agent.fitness / specie.length
      }
    }
    let agentsValues = Array.from(this.agents.values())
    agentsValues.sort((a, b) => a.adjustedFitness - b.adjustedFitness)
    agentsValues = agentsValues.slice(0, this.agents.size * (1 - this.survivalRate))
    for (const agent of agentsValues) {
      this.removeAgent(agent)
    }
    for (const specie of Array.from(this.species.values())) {
      if (specie.length === 0) {
        this.species.delete(specie.id)
      }
    }
  }

  crossover (dominant: Agent, recessive: Agent, index: number): void {
    const newGenome = dominant.crossover(recessive)
    const newAgent = new Agent(newGenome, this.games[index])
    this.agents.set(newAgent.id, newAgent)
  }

  mutate (): void {
    for (const agent of this.agents.values()) {
      agent.mutate()
    }
  }

  speciate (): void {
    for (const specie of this.species.values()) {
      specie.resetSpecie()
    }
    for (const agent of this.agents.values()) {
      let found = false
      for (const specie of this.species.values()) {
        if (specie.checkDistance(agent) < this.threshold) {
          specie.addMember(agent)
          found = true
          break
        }
      }
      if (!found) {
        const newSpecie = new Specie(agent)
        this.species.set(newSpecie.id, newSpecie)
      }
    }
  }
}
