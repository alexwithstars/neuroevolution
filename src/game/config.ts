import type { GAME_CONFIG_INTERFACE } from './game.d'

export const GAME_CONFIG: GAME_CONFIG_INTERFACE = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
  PHYSICS_FREQUENCY: 60,
  SIMULATED_SECONDS: 1,
  TOTAL_TIME: 30,
  RUNS: 3,
  BOT: {
    MAX_SPEED: 100,
    MAX_ANGULAR_SPEED: 180,
    RADIUS: 10
  },
  BALL: {
    RADIUS: 5,
    MIN_SPEED: 50,
    MAX_SPEED: 100,
    SHOULD_MOVE: false
  },
  PLAYER: {
    ANGLE_DELTA: 10,
    SPEED_DELTA: 5
  }
}
