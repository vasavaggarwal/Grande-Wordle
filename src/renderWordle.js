import { WORDLE_IMAGES } from './wordle.js'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load a required image: ${src}`))
    image.src = src
  })
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

export async function renderWordle(canvas, result) {
  const entries = await Promise.all(Object.entries(WORDLE_IMAGES).map(async ([color, src]) => [color, await loadImage(src)]))
  const images = Object.fromEntries(entries)
  const header = `${result.gameNumber}  ${result.score}/6`
  const measurementCanvas = document.createElement('canvas')
  const measurementContext = measurementCanvas.getContext('2d')
  measurementContext.font = '700 72px Arial, Helvetica, sans-serif'
  const width = Math.max(960, Math.ceil(measurementContext.measureText(header).width + 96))
  const height = width * 4 / 3
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#f7f7f7'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 92px Arial, Helvetica, sans-serif'
  ctx.fillText('GrandeWordle', width / 2, 124)

  ctx.font = '700 72px Arial, Helvetica, sans-serif'
  ctx.fillText(header, width / 2, 232)

  const tile = 120
  const gapX = 16
  const gapY = 28
  const boardWidth = tile * 5 + gapX * 4
  const startX = (width - boardWidth) / 2
  const startY = 270
  result.rows.forEach((row, rowIndex) => row.forEach((color, columnIndex) => {
    const x = startX + columnIndex * (tile + gapX)
    const y = startY + rowIndex * (tile + gapY)
    ctx.save()
    roundedRect(ctx, x, y, tile, tile, 10)
    ctx.clip()
    const image = images[color]
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - sourceSize) / 2
    const sourceY = (image.naturalHeight - sourceSize) / 2
    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, x, y, tile, tile)
    ctx.restore()
  }))

  ctx.fillStyle = '#e5e5e5'
  ctx.font = '400 32px Arial, Helvetica, sans-serif'
  ctx.fillText('try it out - grandewordle.vercel.app', width / 2, height - 66)
}
