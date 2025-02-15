export interface GAME_CONFIG_INTERFACE {
  WIDTH: number
  HEIGHT: number
  PHYSICS_FREQUENCY: number
  SIMULATED_SECONDS: number
  TOTAL_TIME: number
  RUNS: number
  BOT: {
    MAX_SPEED: number
    MAX_ANGULAR_SPEED: number
    RADIUS: number
  }
  BALL: {
    RADIUS: number
    MIN_SPEED: number
    MAX_SPEED: number
    SHOULD_MOVE: boolean
  }
  PLAYER: {
    ANGLE_DELTA: number
    SPEED_DELTA: number
  }
}
