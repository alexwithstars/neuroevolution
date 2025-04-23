import { Ball, Bot } from './objects'
import { circularNumber, correctCollision, randomDouble, randomInt, shortestRotation, toRad } from '../misc/math'
import type { inputSource, outputTarget } from '../neuralNetwork/network.d'
import { GAME_CONFIG } from './config'
import type { Agent } from '../neuralNetwork/population'

export class GameInterface {
  inputs: inputSource[] = []
  outputs: outputTarget[] = []
  getBotX: inputSource
  getBotY: inputSource
  getBotCos: inputSource
  getBotSin: inputSource
  getBotSpeed: inputSource
  getBotAngularSpeed: inputSource
  getBallX: inputSource
  getBallY: inputSource
  getBallSpeed: inputSource
  getBallDirection: inputSource
  getDistance: inputSource
  getToBallSin: inputSource
  getToBallCos: inputSource
  addBotSpeed: outputTarget
  addBotAngularSpeed: outputTarget
  static fixedNames: string[] = [
    'sinBot',
    'cosBot',
    'botSpeed',
    'botAngularSpeed',
    'distance',
    'sinBall',
    'cosBall'
  ]

  constructor (game: Game) {
    this.getBotX = () => game.bot.position.x
    this.getBotY = () => game.bot.position.y
    this.getBotSin = () => Math.sin(toRad(game.bot.angle))
    this.getBotCos = () => Math.cos(toRad(game.bot.angle))
    this.getBotSpeed = () => game.bot.speed
    this.getBotAngularSpeed = () => game.bot.angularSpeed
    this.getBallX = () => game.ball.position.x
    this.getBallY = () => game.ball.position.y
    this.getBallSpeed = () => game.ball.getSpeed()
    this.getBallDirection = () => game.ball.getDirectionDeg()
    this.getToBallSin = () => Math.sin(toRad(game.getAngle()))
    this.getToBallCos = () => Math.cos(toRad(game.getAngle()))
    this.getDistance = () => game.getDistance()
    this.addBotSpeed = (delta: number) => {
      const maxDelta = game.bot.maxSpeed / GAME_CONFIG.PHYSICS_FREQUENCY
      game.bot.addSpeed(-maxDelta + delta * 2 * maxDelta)
    }
    this.addBotAngularSpeed = (delta: number) => {
      const maxDelta = game.bot.maxAngularSpeed / GAME_CONFIG.PHYSICS_FREQUENCY
      game.bot.addAngularSpeed(-maxDelta + delta * 2 * maxDelta)
    }
    this.inputs = [
      // this.getBotX, this.getBotY,
      this.getBotSin, this.getBotCos, this.getBotSpeed,
      this.getBotAngularSpeed,
      // this.getBallX, this.getBallY,
      // this.getBallSpeed, this.getBallDirection,
      this.getDistance, this.getToBallSin, this.getToBallCos
    ]
    this.outputs = [
      // this.addBotSpeed,
      this.addBotAngularSpeed
    ]
  }
}

export class Game {
  width: number
  height: number
  ball: Ball
  bot: Bot
  minimalInitialDistance: number
  score: number
  distanceSum: number
  botTraveled: number
  lastDistance: number
  deltaPositive: number
  deltaNegative: number
  deltaPositiveCounter: number
  deltaNegativeCounter: number
  botCollideCounter: number
  constructor (width: number, height: number) {
    this.width = width
    this.height = height
    this.score = 0
    this.minimalInitialDistance = Math.sqrt(width ** 2 + height ** 2) / 3
    const ballRadius = GAME_CONFIG.BALL.RADIUS
    const botRadius = GAME_CONFIG.BOT.RADIUS
    this.bot = new Bot(0, 0, botRadius)
    this.ball = new Ball(0, 0, ballRadius)
    this.setRandomBotPosition()
    this.setRandomBallPosition()
    this.deltaPositive = 0
    this.deltaNegative = 0
    this.deltaPositiveCounter = 1
    this.deltaNegativeCounter = 1
    this.distanceSum = 0
    this.botTraveled = 0
    this.botCollideCounter = 0
    this.lastDistance = this.getDistance()
  }

  resetStatistics (): void {
    this.deltaPositive = 0
    this.deltaNegative = 0
    this.deltaPositiveCounter = 1
    this.deltaNegativeCounter = 1
    this.distanceSum = 0
    this.botTraveled = 0
    this.botCollideCounter = 0
    this.lastDistance = this.getDistance()
  }

  update (dt: number): void {
    this.botTraveled += this.bot.speed * dt
    this.ball.update(dt)
    this.bot.update(dt)
    this.solveBallCollision()
    this.solveBotCollision()
    this.solveScore()
  }

  solveBallCollision (): void {
    const [x, y] = this.ball.position.getComponents()
    const [ox, oy] = this.ball.oldPosition.getComponents()
    const radius = this.ball.radius
    if (x < radius) {
      [this.ball.oldPosition.x, this.ball.position.x] =
      correctCollision(ox, x, radius)
    }
    if (x > this.width - radius) {
      [this.ball.oldPosition.x, this.ball.position.x] =
      correctCollision(ox, x, (this.width - radius))
    }
    if (y < radius) {
      [this.ball.oldPosition.y, this.ball.position.y] =
      correctCollision(oy, y, radius)
    }
    if (y > this.height - radius) {
      [this.ball.oldPosition.y, this.ball.position.y] =
      correctCollision(oy, y, (this.height - radius))
    }
  }

  solveBotCollision (): void {
    const [x, y] = this.bot.position.getComponents()
    let collide = false
    if (x < this.bot.radius) {
      this.bot.position.x = this.bot.radius
      collide = true
    }
    if (x > this.width - this.bot.radius) {
      this.bot.position.x = this.width - this.bot.radius
      collide = true
    }
    if (y < this.bot.radius) {
      this.bot.position.y = this.bot.radius
      collide = true
    }
    if (y > this.height - this.bot.radius) {
      this.bot.position.y = this.height - this.bot.radius
      collide = true
    }
    if (collide) this.botCollideCounter++
  }

  solveScore (): void {
    const distance = this.getDistance()
    const deltaDistance = distance - this.lastDistance
    if (deltaDistance > 0) {
      this.deltaPositive += deltaDistance
      this.deltaPositiveCounter += 1
    } else {
      this.deltaNegative -= deltaDistance
      this.deltaNegativeCounter += 1
    }
    this.lastDistance = distance
    this.distanceSum += distance
    if (distance < this.bot.radius + this.ball.radius) {
      this.score += 1
      this.setRandomBallPosition()
    }
  }

  setRandomBotPosition (): void {
    this.bot.setPosition(
      randomDouble(this.bot.radius, this.width - this.bot.radius),
      randomDouble(this.bot.radius, this.height - this.bot.radius)
    )
    this.bot.speed = 0
    this.bot.angularSpeed = 0
    this.bot.setAngle(randomDouble(0, 360))
  }

  setRandomBallPosition (): void {
    do {
      this.ball.setPosition(
        randomDouble(this.ball.radius, this.width - this.ball.radius),
        randomDouble(this.ball.radius, this.height - this.ball.radius)
      )
    } while (this.getDistance() < this.minimalInitialDistance)
    if (GAME_CONFIG.BALL.SHOULD_MOVE) this.ball.addRandomSpeed()
  }

  getAngle (): number {
    const [bx, by] = this.ball.position.getComponents()
    const [botx, boty] = this.bot.position.getComponents()
    const dx = bx - botx
    const dy = by - boty
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    return (360 + (angle % 360)) % 360
  }

  getDistance (): number {
    const [bx, by] = this.ball.position.getComponents()
    const [botx, boty] = this.bot.position.getComponents()
    return Math.sqrt((bx - botx) ** 2 + (by - boty) ** 2)
  }

  reset (): void {
    this.score = 0
    this.setRandomBotPosition()
    this.setRandomBallPosition()
    this.resetStatistics()
  }
}

export class Playground {
  physicsFrequencyPerSec: number
  totalTimeSec: number
  totalTimeMs: number
  targetFrameTimeSec: number
  targetFrametimeMs: number
  calculatedTimeMs: number
  constructor (totalTimeSecs: number, physicsFrequencyPerSec: number, simulatedSeconds: number) {
    this.physicsFrequencyPerSec = physicsFrequencyPerSec
    this.totalTimeSec = totalTimeSecs
    this.totalTimeMs = totalTimeSecs * 1000
    this.targetFrameTimeSec = simulatedSeconds / physicsFrequencyPerSec
    this.targetFrametimeMs = this.targetFrameTimeSec * 1000
    this.calculatedTimeMs = 0
  }

  fitnessFunction (
    avgNormalizedDelta: number,
    avgNormalizedBotTraveled: number
  ): number {
    if (avgNormalizedDelta < 0 || avgNormalizedDelta > 1) {
      console.warn(avgNormalizedDelta)
      throw new Error('Avg normalized delta must be between 0 and 1')
    }
    if (avgNormalizedBotTraveled < 0 || avgNormalizedBotTraveled > 1) {
      console.warn(avgNormalizedBotTraveled)
      throw new Error('Avg normalized bot traveled must be between 0 and 1')
    }
    const fitness = avgNormalizedDelta
    if (fitness < 0) {
      console.warn(fitness)
      throw new Error('Fitness cannot be negative')
    }
    return fitness
  }

  evaluate (agent: Agent, game: Game): void {
    const maxTravel = game.bot.maxSpeed * GAME_CONFIG.TOTAL_TIME
    let avgNormalizedDelta = 0
    let avgNormalizedBotTraveled = 0
    for (let i = 0; i < GAME_CONFIG.RUNS; i++) {
      this.calculatedTimeMs = 0
      game.reset()
      while (this.calculatedTimeMs < this.totalTimeMs) {
        agent.think()
        game.update(this.targetFrameTimeSec)
        this.calculatedTimeMs += this.targetFrametimeMs
      }
      const avgDeltaPositive = game.deltaPositive / game.deltaPositiveCounter
      const normalizedDeltaPositive = avgDeltaPositive / game.bot.maxSpeed
      const avgDeltaNegative = game.deltaNegative / game.deltaNegativeCounter
      const normalizedDeltaNegative = avgDeltaNegative / game.bot.maxSpeed
      const deltaPositiveScale = 5
      const avgDelta = normalizedDeltaNegative / (1 + normalizedDeltaPositive * deltaPositiveScale)
      avgNormalizedDelta += avgDelta
      avgNormalizedBotTraveled += game.botTraveled / maxTravel
    }
    avgNormalizedDelta /= GAME_CONFIG.RUNS
    avgNormalizedBotTraveled /= GAME_CONFIG.RUNS
    agent.fitness = this.fitnessFunction(
      avgNormalizedDelta,
      avgNormalizedBotTraveled
    )
  }
}

export function autoBot (game: Game): void {
  const botAngle = game.bot.angle
  const minDistance = shortestRotation(botAngle, game.getAngle())
  if (game.getAngle() !== botAngle) {
    const maxDelta = game.bot.maxAngularSpeed / GAME_CONFIG.PHYSICS_FREQUENCY
    const delta = shortestRotation(game.bot.angularSpeed, minDistance)
    game.bot.addAngularSpeed(Math.min(delta, maxDelta))
  }
  const maxDelta = game.bot.maxSpeed / GAME_CONFIG.PHYSICS_FREQUENCY
  game.bot.addSpeed(Math.abs(minDistance) < 60 ? maxDelta : -maxDelta)
}
