const TILE_EMOJI = new Map([
  ['⬛', 'black'],
  ['⬜', 'black'],
  ['🟨', 'yellow'],
  ['🟩', 'green'],
])

const TILE_CANDIDATES = new Set([
  ...TILE_EMOJI.keys(),
  '🟥', '🟧', '🟦', '🟪', '🟫', '🔲', '🔳', '◻', '◼', '▫', '▪',
])

function fail(message) {
  throw new Error(message)
}

function parseHeader(input) {
  const titleMatch = input.match(/\bWordle\b/i)
  if (!titleMatch) fail('Wordle title missing.')

  const afterTitle = input.slice(titleMatch.index + titleMatch[0].length).trimStart()
  const numberToken = afterTitle.match(/^(\S+)/)?.[1]
  if (!numberToken || /^[1-6X]\/6$/i.test(numberToken)) {
    fail('Please enter the Wordle game number.')
  }

  if (/^-\d+$/.test(numberToken)) {
    fail('Wordle game number must be greater than zero.')
  }
  if (/^\d+$/.test(numberToken)) {
    if (Number(numberToken) <= 0) fail('Wordle game number must be greater than zero.')
    if (numberToken.length > 3) fail('Wordle game number is incorrectly formatted.')
  } else if (numberToken.includes(',')) {
    if (!/^\d{1,3}(?:,\d{3})+$/.test(numberToken)) {
      fail('Invalid Wordle game number format.')
    }
  } else if (!/^\d+$/.test(numberToken)) {
    fail('Please enter the Wordle game number.')
  }

  const digits = numberToken.replaceAll(',', '')
  if (!Number.isSafeInteger(Number(digits))) fail('Wordle game number is incorrectly formatted.')

  const scoreToken = afterTitle.slice(numberToken.length).trim().split(/\s+/).find((token) => token.includes('/'))
  if (!scoreToken) fail('Please enter your Wordle score.')
  if (!/^(?:[1-6]|X)\/6$/i.test(scoreToken)) fail('Invalid score.')

  return { gameNumber: numberToken, score: scoreToken[0].toUpperCase() }
}

function findGridLines(input) {
  return input.split(/\r?\n/).filter((line) => Array.from(line).some((character) => TILE_CANDIDATES.has(character)))
}

export function parseWordleResult(input) {
  const { gameNumber, score } = parseHeader(input)
  const gridLines = findGridLines(input)

  for (const line of gridLines) {
    const characters = Array.from(line).filter((character) => character !== '\uFE0F' && !/\s/.test(character))
    if (characters.some((character) => !TILE_EMOJI.has(character))) {
      fail('Your result contains unsupported tiles.')
    }
  }

  const rows = gridLines.map((line) => Array.from(line)
    .filter((character) => TILE_EMOJI.has(character))
    .map((character) => TILE_EMOJI.get(character)))

  if (rows.some((row) => row.length !== 5)) fail('Every row must contain exactly 5 boxes.')
  if (!rows.length) {
    if (score === 'X') fail('An incomplete Wordle result must contain exactly 6 rows.')
    fail(`Your result must contain ${score} rows.`)
  }

  if (score === 'X') {
    if (rows.length !== 6) fail('An incomplete Wordle result must contain exactly 6 rows.')
    if (rows.some((row) => row.every((color) => color === 'green'))) {
      fail('A failed Wordle attempt cannot contain a completed guess.')
    }
  } else {
    if (rows.length !== Number(score)) fail('Number of rows must match the numerator of your score.')
    const isGreenRow = (row) => row.every((color) => color === 'green')
    if (rows.slice(0, -1).some(isGreenRow)) fail('Only the final row can contain five green squares.')
    if (!isGreenRow(rows.at(-1))) fail('Your final row must contain five green squares.')
  }

  return { gameNumber, score, rows }
}

export const WORDLE_IMAGES = {
  black: '/assets/black-ariana.jpg',
  yellow: '/assets/yellow-ariana.jpg',
  green: '/assets/green-ariana.jpg',
}
