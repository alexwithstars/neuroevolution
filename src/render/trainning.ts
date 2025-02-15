import { canvasDPI, checkInstance } from '../misc/utils'
import { Population } from '../neuralNetwork/population'

export class TrainningRenderer {
  context: CanvasRenderingContext2D
  gameCanvas: HTMLCanvasElement
  mainElement: HTMLElement
  generationElement: HTMLElement
  speciesElement: HTMLElement
  avgFitnessElement: HTMLElement
  toggleButton: HTMLElement
  simulateButton: HTMLElement
  population: Population
  constructor () {
    const canvas = document.getElementById('progress')
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Failed to get canvas')
    const ctx = canvas.getContext('2d')
    if (ctx === null) throw new Error('Failed to get 2d context')
    this.context = ctx
    canvasDPI(400, 100, canvas, true)

    this.gameCanvas = checkInstance(document.getElementById('gameCanvas'), HTMLCanvasElement)
    this.mainElement = checkInstance(document.getElementById('main'), HTMLElement)
    this.generationElement = checkInstance(document.getElementById('generation'), HTMLElement)
    this.speciesElement = checkInstance(document.getElementById('species'), HTMLElement)
    this.avgFitnessElement = checkInstance(document.getElementById('avgFitness'), HTMLElement)
    this.toggleButton = checkInstance(document.getElementById('toggle'), HTMLElement)
    this.simulateButton = checkInstance(document.getElementById('simulate'), HTMLElement)

    this.population = new Population(this)

    this.toggleButton.addEventListener('click', () => { this.toggleRunning() })
    this.simulateButton.addEventListener('click', () => this.toggleSimulation())
  }

  toggleRunning (): void {
    this.population.toggleTraining()
  }

  toggleSimulation (): void {
    if (this.population.toggleGameRender()) {
      this.mainElement.classList.add('hide')
      this.gameCanvas.classList.remove('hide')
    } else {
      this.mainElement.classList.remove('hide')
      this.gameCanvas.classList.add('hide')
    }
  }

  renderInfo (): void {
    const { generation, species, avgFitness } = this.population
    this.generationElement.textContent = `${generation}`
    this.speciesElement.textContent = `${species.size}`
    this.avgFitnessElement.textContent = `${avgFitness.toFixed(4)}`
  }

  renderProgress (): void {
    const { progress, next } = this.population
    const { height, width } = this.context.canvas
    const size = 2
    this.context.clearRect(0, 0, width, height)

    this.context.fillStyle = '#fff'
    this.context.fillRect(0, 0, size * progress, 10)

    this.context.fillStyle = '#c00'
    this.context.fillRect(0 + 100 * size, 0, 2, 10)

    this.context.font = '12px Arial'
    this.context.fillStyle = '#fff'
    this.context.fillText(`${(progress).toFixed(2)}%`, 100 * size + 2 * size, 10)

    this.context.font = '16px Arial'
    this.context.fillStyle = '#fff'
    this.context.fillText(`Next: ${next ? 'yes' : 'no'}`, 0, 30)
  }
}
