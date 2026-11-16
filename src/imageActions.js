function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (!canvas || typeof canvas.toBlob !== 'function') {
      reject(new Error('PNG export is not supported in this browser.'))
      return
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The preview could not be exported as a PNG.'))
    }, 'image/png')
  })
}

export async function copyCanvasPngToClipboard(canvas) {
  if (!navigator.clipboard?.write || typeof window.ClipboardItem !== 'function') {
    throw new Error('Image copying is not supported by this browser. Try downloading the PNG instead.')
  }
  const png = await canvasToPngBlob(canvas)
  await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': png })])
}

export async function downloadCanvasPng(canvas, gameNumber) {
  const png = await canvasToPngBlob(canvas)
  const url = URL.createObjectURL(png)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `GrandeWordle-${gameNumber}.png`
    link.hidden = true
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
