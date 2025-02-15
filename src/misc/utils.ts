export async function delay (time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

export function canvasDPI (width: number, height: number, canvas: HTMLCanvasElement, scale: boolean = false): void {
  const ratio = window.devicePixelRatio
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  scale && canvas.getContext('2d')?.scale(ratio, ratio)
}

export function checkInstance (instance: any, type: any): any {
  if (instance instanceof type) return instance
  let iname = 'uknown'
  let tname = 'uknown'
  try {
    iname = instance.constructor.name
  } catch {}
  try {
    tname = type.name
  } catch {}
  throw new Error(`${iname} is not an instance of the ${tname}`)
}
