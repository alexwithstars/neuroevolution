import { Position2d, capDelta, randomDouble, Vector2d, toDeg } from '../misc/math'
import { GAME_CONFIG } from './config'
import { AngularVerletObject, VerletObject } from './physics'

export class Ball extends VerletObject {
  radius: number
  constructor (x: number, y: number, radius: number) {
    super(x, y)
    this.radius = radius
  }

  getSpeed (): number {
    return Vector2d.subtractVectors(this.position, this.oldPosition).magnitude
  }

  getDirectionDeg (): number {
    return toDeg(
      Vector2d.subtractVectors(this.position, this.oldPosition).directionRad
    )
  }

  setPosition (x: number, y: number): void {
    this.oldPosition.setVector(new Position2d(x, y))
    this.position.setVector(new Position2d(x, y))
    this.acceleration.setVector(new Vector2d(0, 0))
  }

  addRandomSpeed (): void {
    const magnitude = randomDouble(GAME_CONFIG.BALL.MIN_SPEED, GAME_CONFIG.BALL.MAX_SPEED)
    const directionDeg = randomDouble(0, 360)
    this.addVelocity(new Vector2d(directionDeg, magnitude))
  }
}

export class Bot extends AngularVerletObject {
  speed: number
  angularSpeed: number
  maxSpeed: number = GAME_CONFIG.BOT.MAX_SPEED
  maxAngularSpeed: number = GAME_CONFIG.BOT.MAX_ANGULAR_SPEED
  radius: number = GAME_CONFIG.BOT.RADIUS
  constructor (x: number, y: number, angle: number) {
    super(x, y, angle)
    this.speed = 0
    this.angularSpeed = 0
  }

  addSpeed (delta: number): void {
    this.speed = capDelta(this.speed, delta, 0, this.maxSpeed)
  }

  addAngularSpeed (delta: number): void {
    this.angularSpeed = capDelta(this.angularSpeed, delta, -this.maxAngularSpeed, this.maxAngularSpeed)
  }

  setPosition (x: number, y: number): void {
    this.oldPosition.setVector(new Position2d(x, y))
    this.position.setVector(new Position2d(x, y))
    this.acceleration.setVector(new Vector2d(0, 0))
  }

  setAngle (angle: number): void {
    this.angle = angle
    this.oldAngle = this.angle
  }

  update (dt: number): void {
    this.oldPosition.setVector(this.position)
    this.addVelocity(new Vector2d(this.angle, this.speed))
    this.oldAngle = this.angle
    this.addAngularVelocity(this.angularSpeed)
    super.update(dt)
  }
}
