import React, { useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { parseWordleResult } from './wordle.js'
import { renderWordle } from './renderWordle.js'
import { copyCanvasPngToClipboard, downloadCanvasPng } from './imageActions.js'
import './style.css'

function App() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [hasPreview, setHasPreview] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const [isRendering, setIsRendering] = useState(false)
  const [generatedGameNumber, setGeneratedGameNumber] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const textareaRef = useRef(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 2}px`
  }, [input])

  useLayoutEffect(() => {
    if (!hasPreview || !canvasRef.current || !previewCanvasRef.current) return
    const generatedCanvas = canvasRef.current
    const previewCanvas = previewCanvasRef.current
    previewCanvas.width = generatedCanvas.width
    previewCanvas.height = generatedCanvas.height
    previewCanvas.getContext('2d').drawImage(generatedCanvas, 0, 0)
  }, [hasPreview, previewRevision])

  async function handleGenerate(event) {
    event.preventDefault()
    setError('')
    setActionMessage('')
    let result
    try {
      result = parseWordleResult(input)
    } catch (parseError) {
      setError(parseError.message)
      return
    }

    setIsRendering(true)
    try {
      const nextCanvas = document.createElement('canvas')
      await renderWordle(nextCanvas, result)
      canvasRef.current = nextCanvas
      setGeneratedGameNumber(result.gameNumber)
      setHasPreview(true)
      setPreviewRevision((revision) => revision + 1)
    } catch (renderError) {
      setError(`${renderError.message} Check that the image assets are available and try again.`)
    } finally {
      setIsRendering(false)
    }
  }

  async function handleCopyImage() {
    if (!hasPreview || generatedGameNumber === null || actionInProgress || isRendering) return
    setActionMessage('')
    setActionInProgress('copy')
    try {
      await copyCanvasPngToClipboard(canvasRef.current)
      setActionMessage('PNG image copied to the clipboard.')
    } catch (copyError) {
      setActionMessage(copyError.name === 'NotAllowedError'
        ? 'Clipboard access was denied. Allow clipboard access and try again.'
        : copyError.message || 'Could not copy the image. Try downloading the PNG instead.')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleDownloadImage() {
    if (!hasPreview || generatedGameNumber === null || actionInProgress || isRendering) return
    setActionMessage('')
    setActionInProgress('download')
    try {
      await downloadCanvasPng(canvasRef.current, generatedGameNumber)
      setActionMessage('PNG download started.')
    } catch (downloadError) {
      setActionMessage(downloadError.message || 'Could not download the image. Please try again.')
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <main className="page">
      <header className="site-header">
        <h1>GrandeWordle</h1>
        <p>Show your Wordle Results using Ariana Grande's various colors over the years.</p>
      </header>

      <form className="input-panel" onSubmit={handleGenerate}>
        <label htmlFor="wordle-result">Paste your Wordle result</label>
        <textarea
          ref={textareaRef}
          id="wordle-result"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'Paste your Wordle Results here...'}
          rows={1}
        />
        <button type="submit" disabled={isRendering || Boolean(actionInProgress)}>
          {isRendering ? 'Creating image…' : 'Generate preview'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>

      <section className="preview" aria-label="Generated Wordle image">
        <h2>Preview</h2>
        {hasPreview && (
          <canvas
            ref={previewCanvasRef}
            className="result-canvas visible"
            aria-label="GrandeWordle result image preview"
          />
        )}
        {!hasPreview && <p className="preview-empty">Your generated image will appear here.</p>}
        {hasPreview && (
          <div className="image-actions" aria-label="Image actions">
            <button
              type="button"
              className="copy-image-button"
              onClick={handleCopyImage}
              disabled={generatedGameNumber === null || isRendering || Boolean(actionInProgress)}
            >
              Copy Image
            </button>
            <button
              type="button"
              className="download-image-button"
              onClick={handleDownloadImage}
              disabled={generatedGameNumber === null || isRendering || Boolean(actionInProgress)}
            >
              Download Image
            </button>
          </div>
        )}
        {actionMessage && <p className="action-message" role="status">{actionMessage}</p>}
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
