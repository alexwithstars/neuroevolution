// -infinity -> infinity
export function plain (value: number): number {
  return value
}

// 0 -> 1
export function sigmoid (value: number): number {
  return 1 / (1 + Math.exp(-value))
}

// 0 -> infinity
export function relu (value: number): number {
  return Math.max(0, value)
}

// -1 -> 1
export function tanh (value: number): number {
  return Math.tanh(value)
}

// -1 -> 1
export function softsign (value: number): number {
  return value / (1 + Math.abs(value))
}

type Vector = Vector2d | Position2d

export class Vector2d {
  directionRad: number
  magnitude: number

  constructor (directionDeg: number, magnitude: number) {
    this.directionRad = directionDeg * Math.PI / 180
    this.magnitude = magnitude
  }

  addVector (vector: Vector): void {
    const [dx, dy] = this.getComponents()
    const [fx, fy] = vector.getComponents()
    const [rx, ry] = [dx + fx, dy + fy]
    this.magnitude = Math.sqrt(rx ** 2 + ry ** 2)
    this.directionRad = Math.atan2(ry, rx)
  }

  subtractVector (vector: Vector): void {
    const [dx, dy] = this.getComponents()
    const [fx, fy] = vector.getComponents()
    const [rx, ry] = [dx - fx, dy - fy]
    this.magnitude = Math.sqrt(rx ** 2 + ry ** 2)
    this.directionRad = Math.atan2(ry, rx)
  }

  setVector (vector: Vector): void {
    const [directionRad, magnitude] = vector.getVectorComponents()
    this.directionRad = directionRad
    this.magnitude = magnitude
  }

  multiplyScalar (scalar: number): void {
    this.magnitude *= scalar
  }

  getComponents (): [number, number] {
    const [dx, dy] = [
      Math.cos(this.directionRad) * this.magnitude,
      Math.sin(this.directionRad) * this.magnitude
    ]
    return [dx, dy]
  }

  getVectorComponents (): [number, number] {
    return [this.directionRad, this.magnitude]
  }

  static addVectors (vector1: Vector, vector2: Vector): Vector2d {
    const [dx, dy] = vector1.getComponents()
    const [fx, fy] = vector2.getComponents()
    const [rx, ry] = [dx + fx, dy + fy]
    return new Vector2d(toDeg(Math.atan2(ry, rx)), Math.sqrt(rx ** 2 + ry ** 2))
  }

  static subtractVectors (vector1: Vector, vector2: Vector): Vector2d {
    const [dx, dy] = vector1.getComponents()
    const [fx, fy] = vector2.getComponents()
    const [rx, ry] = [dx - fx, dy - fy]
    return new Vector2d(toDeg(Math.atan2(ry, rx)), Math.sqrt(rx ** 2 + ry ** 2))
  }

  static scaleVector (vector: Vector, scalar: number): Vector2d {
    const [dx, dy] = vector.getComponents()
    const [rx, ry] = [dx * scalar, dy * scalar]
    return new Vector2d(toDeg(Math.atan2(ry, rx)), Math.sqrt(rx ** 2 + ry ** 2))
  }
}

export class Position2d {
  x: number
  y: number
  constructor (x: number, y: number) {
    this.x = x
    this.y = y
  }

  addVector (vector: Vector): void {
    const [dx, dy] = vector.getComponents()
    this.x += dx
    this.y += dy
  }

  substractVector (vector: Vector): void {
    const [dx, dy] = vector.getComponents()
    this.x -= dx
    this.y -= dy
  }

  multiplyScalar (scalar: number): void {
    this.x *= scalar
    this.y *= scalar
  }

  setVector (vector: Vector): void {
    const [dx, dy] = vector.getComponents()
    this.x = dx
    this.y = dy
  }

  getComponents (): [number, number] {
    return [this.x, this.y]
  }

  getVectorComponents (): [number, number] {
    const [directionRad, magnitude] = [
      Math.atan2(this.x, this.y),
      Math.sqrt(this.x ** 2 + this.y ** 2)
    ]
    return [directionRad, magnitude]
  }

  static addVectors (vector1: Vector, vector2: Vector): Position2d {
    const [dx, dy] = vector1.getComponents()
    const [fx, fy] = vector2.getComponents()
    const [rx, ry] = [dx + fx, dy + fy]
    return new Position2d(rx, ry)
  }

  static subtractVectors (vector1: Vector, vector2: Vector): Position2d {
    const [dx, dy] = vector1.getComponents()
    const [fx, fy] = vector2.getComponents()
    const [rx, ry] = [dx - fx, dy - fy]
    return new Position2d(rx, ry)
  }

  static scaleVector (vector: Vector, scalar: number): Position2d {
    const [dx, dy] = vector.getComponents()
    const [rx, ry] = [dx * scalar, dy * scalar]
    return new Position2d(rx, ry)
  }
}

export function correctCollision (oldX: number, newX: number, collision: number): [number, number] {
  const timeC = (collision - newX) / (oldX - newX)
  const xC = timeC * oldX + (1 - timeC) * newX
  const correctOldX = oldX + 2 * (xC - oldX)
  const correctNewX = newX + 2 * (xC - newX)
  return [correctOldX, correctNewX]
}

export function capDelta (value: number, delta: number, min: number, max: number): number {
  let newValue = value + delta
  if (newValue > max) newValue = max
  if (newValue < min) newValue = min
  return newValue
}

export function toRad (angle: number): number {
  return angle / 180 * Math.PI
}

export function toDeg (angle: number): number {
  return angle * 180 / Math.PI
}

export function randomInt (min: number, max: number): number {
  return Math.floor(Math.random() * ((max + 1) - min) + min)
}

export function randomDouble (min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function layerLength (n: number, element: number, gap: number): number {
  return n * element + Math.max(n - 1, 0) * gap
}

export function centerF (n: number, element: number, gap: number): number {
  return n * element - element / 2 + (n - 1) * gap
}

export function circularNumber (n: number, max: number): number {
  return (max + (n % max)) % max
}

export function shortestRotation (current: number, target: number): number {
  return (target - current + 540) % 360 - 180
}
