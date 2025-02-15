import { circularNumber, Position2d, Vector2d } from '../misc/math'

export class VerletObject {
  position: Position2d
  oldPosition: Position2d
  acceleration: Vector2d
  pendingVelocity: Vector2d
  oldDt: number
  constructor (x: number, y: number) {
    this.position = new Position2d(x, y)
    this.oldPosition = new Position2d(x, y)
    this.acceleration = new Vector2d(0, 0)
    this.pendingVelocity = new Vector2d(0, 0)
    this.oldDt = 0
  }

  accelerate (acceleration: Vector2d): void {
    this.acceleration.addVector(acceleration)
  }

  addVelocity (velocity: Vector2d, dt: number = 1): void {
    this.pendingVelocity.addVector(Position2d.scaleVector(velocity, 1 / dt))
  }

  update (dt: number): void {
    if (this.oldDt === 0) {
      this.oldDt = dt
      return
    }
    const velocity = Vector2d.subtractVectors(this.position, this.oldPosition)
    this.oldPosition.setVector(this.position)
    this.position.addVector(
      Position2d.addVectors(
        Position2d.scaleVector(this.acceleration, ((dt + this.oldDt) / 2) * dt),
        Position2d.scaleVector(velocity, dt / this.oldDt)
      )
    )
    this.position.addVector(Position2d.scaleVector(this.pendingVelocity, dt))
    this.oldDt = dt
    this.pendingVelocity.setVector(new Vector2d(0, 0))
    this.acceleration.setVector(new Vector2d(0, 0))
  }
}

export class AngularVerletObject extends VerletObject {
  _angle: number
  _oldAngle: number
  angularAcceleration: number
  angularPendingVelocity: number
  constructor (x: number, y: number, angle: number) {
    super(x, y)
    this._angle = angle
    this._oldAngle = angle
    this.angularAcceleration = 0
    this.angularPendingVelocity = 0
  }

  accelerateAngular (acceleration: number): void {
    this.angularAcceleration += acceleration
  }

  addAngularVelocity (velocity: number, dt: number = 1): void {
    this.angularPendingVelocity += (velocity / dt)
  }

  update (dt: number): void {
    if (this.oldDt === 0) {
      this.oldDt = dt
      return
    }
    const velocity = this.angle - this.oldAngle
    this.oldAngle = this.angle
    this.angle += (
      this.angularAcceleration * ((dt + this.oldDt) / 2) * dt +
      velocity * (dt / this.oldDt)
    )
    this.angle += this.angularPendingVelocity * dt
    const distance = Vector2d.subtractVectors(
      this.position,
      this.oldPosition
    )
    this.oldPosition = Position2d.addVectors(
      this.position,
      new Vector2d(
        this.angle,
        distance.magnitude
      )
    )
    this.angularPendingVelocity = 0
    this.angularAcceleration = 0
    super.update(dt)
  }

  get angle (): number {
    return this._angle
  }

  set angle (newAngle: number) {
    this._angle = circularNumber(newAngle, 360)
  }

  get oldAngle (): number {
    return this._oldAngle
  }

  set oldAngle (newAngle: number) {
    this._oldAngle = circularNumber(newAngle, 360)
  }
}
