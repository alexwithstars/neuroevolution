import { GAME_CONFIG } from '../game/config'
import { autoBot, Game } from '../game/playground'
import { toRad } from '../misc/math'
import { canvasDPI, checkInstance } from '../misc/utils'
import { Phenotype } from '../neuralNetwork/genome'
import { Agent } from '../neuralNetwork/population'

export class GameRenderer {
  game: Game
  agent: Agent | null
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  raf: number = 0
  lastTimeMs: number
  physicsFrequencyPerSec: number
  targetFrameTimeSec: number
  targetFrameTimeMs: number
  calculatedTimeMs: number
  phenotype: Phenotype | null
  userControls = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  constructor (game: Game, physicsFrequency: number, agent: Agent | null = null) {
    this.game = game
    this.agent = agent
    this.phenotype = null
    this.physicsFrequencyPerSec = physicsFrequency
    this.targetFrameTimeSec = 1 / physicsFrequency
    this.targetFrameTimeMs = this.targetFrameTimeSec * 1000
    this.lastTimeMs = 0
    this.calculatedTimeMs = 0
    this.canvas = checkInstance(document.getElementById('gameCanvas'), HTMLCanvasElement)
    canvasDPI(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, this.canvas, true)
    const ctx = this.canvas.getContext('2d')
    if (ctx === null) throw new Error('Failed to get 2d context')
    this.ctx = ctx
    if (agent !== null) {
      this.phenotype = new Phenotype(agent, 10, 50)
      return
    }
    window.addEventListener('keydown', (event: KeyboardEvent) => this.handleKeydown(event))
    window.addEventListener('keyup', (event: KeyboardEvent) => this.handleKeyup(event))
  }

  handleKeydown (event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft') this.userControls.left = true
    if (event.code === 'ArrowRight') this.userControls.right = true
    if (event.code === 'ArrowUp') this.userControls.up = true
    if (event.code === 'ArrowDown') this.userControls.down = true
  }

  handleKeyup (event: KeyboardEvent): void {
    if (event.code === 'ArrowLeft') this.userControls.left = false
    if (event.code === 'ArrowRight') this.userControls.right = false
    if (event.code === 'ArrowUp') this.userControls.up = false
    if (event.code === 'ArrowDown') this.userControls.down = false
  }

  start (): void {
    this.raf = window.requestAnimationFrame((time: number) => {
      this.lastTimeMs = time
      this.calculatedTimeMs = time
      this.game.reset(true)
      this.loop(time)
    })
  }

  loop (time: number = 0): void {
    this.raf = window.requestAnimationFrame((time: number) => this.loop(time))
    const elapsedTimeInSeconds = (time - this.lastTimeMs) / 1000
    this.lastTimeMs = time
    if (elapsedTimeInSeconds >= 1) return
    while (this.calculatedTimeMs <= time) {
      this.control()
      // autoBot(this.game)
      this.game.update(this.targetFrameTimeSec)
      this.calculatedTimeMs += this.targetFrameTimeMs
    }
    this.draw()
  }

  stop (): void {
    window.cancelAnimationFrame(this.raf)
  }

  control (): void {
    if (this.agent !== null) {
      this.agent.think()
      return
    }
    if (this.userControls.left) {
      this.game.bot.addAngularSpeed(-GAME_CONFIG.PLAYER.ANGLE_DELTA)
    }
    if (this.userControls.right) {
      this.game.bot.addAngularSpeed(GAME_CONFIG.PLAYER.ANGLE_DELTA)
    }
    if (this.userControls.up) {
      this.game.bot.addSpeed(GAME_CONFIG.PLAYER.SPEED_DELTA)
    }
    if (this.userControls.down) {
      this.game.bot.addSpeed(-GAME_CONFIG.PLAYER.SPEED_DELTA)
    }
  }

  draw (): void {
    const ball = this.game.ball
    const bot = this.game.bot

    this.ctx.clearRect(0, 0, this.game.width, this.game.height)

    this.ctx.fillStyle = '#fff'
    this.ctx.beginPath()
    this.ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.closePath()

    this.ctx.beginPath()
    this.ctx.arc(bot.position.x, bot.position.y, bot.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.closePath()

    this.ctx.strokeStyle = '#000'
    const lineWidth = bot.radius / 5
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    this.ctx.arc(
      bot.position.x,
      bot.position.y,
      bot.radius - lineWidth / 2,
      toRad(bot.angle - 90),
      toRad(bot.angle + 90)
    )
    this.ctx.stroke()
    this.ctx.closePath()

    this.ctx.lineWidth = bot.radius / 10
    const distance = bot.radius / 3
    this.ctx.beginPath()
    this.ctx.arc(
      Math.cos(toRad(bot.angle)) * distance + bot.position.x,
      Math.sin(toRad(bot.angle)) * distance + bot.position.y,
      bot.radius / 5,
      0,
      2 * Math.PI
    )
    this.ctx.stroke()
    this.ctx.closePath()

    this.ctx.fillStyle = '#0f0'
    this.ctx.font = '20px Arial'
    this.ctx.fillText(`Score: ${this.game.score}`, 10, 30)

    if (this.phenotype === null) return

    this.phenotype.render(this.ctx)
  }
}
