import { msg, str } from '@lit/localize'
import { noChange, nothing } from 'lit'
import {
  AsyncDirective,
  directive,
  ElementPart,
  PartInfo,
  PartType,
} from 'lit/async-directive.js'

/**
 * Tic-tac-toe (tris) to fill the pre-first-token wait, ~7s in production.
 *
 * Lifecycle is tied to the thinking indicator: the directive mounts when the
 * thinking item renders and `disconnected()` tears it down on the first
 * text_delta. It lives inside a normal history item, not an overlay, so the
 * conversation above stays scrollable.
 *
 * Built from buttons rather than a canvas: nine cells is little enough DOM that
 * accessibility and keyboard handling come for free, and there is no animation
 * loop to leak on a customer's page. Colours come from the widget's existing
 * --message-background / --message-content variables via CSS.
 */

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
]

/** Centre and corners — the squares worth taking. */
const STRONG = [4, 0, 2, 6, 8]
const EDGES = [1, 3, 5, 7]

/** Delay before the opponent replies, so it reads as a move rather than a jump */
const REPLY_DELAY = 320
/**
 * Delay before the opponent's opening move. It moves first so an empty grid is
 * never left sitting there ambiguously: seeing a mark appear is what tells the
 * user this is a game and that it is their turn.
 */
const OPENING_DELAY = 260
/** How long a finished board is shown before it resets for another round */
const RESET_DELAY = 1100
/**
 * Chance the opponent plays a random legal move instead of the best one.
 * Perfect play always draws, which gets dull fast; this keeps it winnable.
 */
const BLUNDER_RATE = 0.25
/** How often the opening takes a strong square rather than an edge. */
const STRONG_OPENING_RATE = 0.7

type Mark = '' | 'x' | 'o'

/**
 * The board outlives a single wait. The card is torn down the moment the answer
 * starts streaming, usually mid-round, so the position is stored and restored on
 * the next thinking phase — otherwise every wait would restart from scratch and
 * a round could never be finished.
 *
 * localStorage rather than a module variable so it also survives a reload, and
 * `pendingBotMove` is stored alongside so a round interrupted while the opponent
 * owed a move resumes with that move instead of stalling on the user.
 */
const STORAGE_KEY = 'tolki-tris'

interface SavedGame {
  board: Mark[]
  pendingBotMove: boolean
}

function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedGame
    if (!Array.isArray(parsed.board) || parsed.board.length !== 9) return null
    if (!parsed.board.every(v => v === '' || v === 'x' || v === 'o')) return null
    return parsed
  }
  catch {
    // Storage can be unavailable (private mode, sandboxed iframe). The game
    // simply starts fresh — never let it break the widget on a customer page.
    return null
  }
}

function saveGame(game: SavedGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }
  catch {
    /* storage unavailable — the round just won't carry over */
  }
}

/** The winning line on a board, or null. */
function winningLine(board: Mark[]): number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return null
}

const isFull = (board: Mark[]): boolean => board.every(v => v !== '')
const isOver = (board: Mark[]): boolean => !!winningLine(board) || isFull(board)

class TrisGameDirective extends AsyncDirective {
  private host?: HTMLElement
  private board: Mark[] = Array<Mark>(9).fill('')
  private cells: HTMLButtonElement[] = []
  private statusEl?: HTMLDivElement
  /** Set while the opponent owes a move — the one bit of turn state, persisted. */
  private pendingBotMove = false
  private timer?: ReturnType<typeof setTimeout>

  /**
   * Derived rather than stored: the board is clickable only when the opponent
   * owes nothing and the round is still live. As a field it meant seven
   * assignments that could drift out of sync with `pendingBotMove`.
   */
  private get locked(): boolean {
    return this.pendingBotMove || isOver(this.board)
  }

  constructor(partInfo: PartInfo) {
    super(partInfo)
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('trisGame must be used as an element-part directive')
    }
  }

  // The real rendering happens imperatively in update(); this only satisfies
  // the abstract signature.
  render(): typeof nothing {
    return nothing
  }

  update(part: ElementPart): typeof noChange {
    const host = part.element as HTMLElement
    if (this.host !== host) {
      this.host = host
      this.mount()
    }
    return noChange
  }

  protected disconnected(): void {
    this.teardown()
  }

  protected reconnected(): void {
    if (this.host) this.mount()
  }

  // ---------------------------------------------------------------------------

  private mount(): void {
    if (!this.host) return
    this.teardown()
    this.buildDom()

    const saved = loadGame()
    if (saved && saved.board.some(v => v !== '') && !isOver(saved.board)) {
      this.board = saved.board
      this.paint()
      if (saved.pendingBotMove) {
        this.pendingBotMove = true
        this.later(() => this.reply(), REPLY_DELAY)
      }
      return
    }

    this.board = Array<Mark>(9).fill('')
    this.paint()
    this.openRound()
  }

  private buildDom(): void {
    if (!this.host) return

    const grid = document.createElement('div')
    grid.className = 'tk__tris-grid'
    grid.setAttribute('role', 'grid')
    grid.setAttribute('aria-label', msg('Tic-tac-toe, playable while you wait'))

    this.cells = []
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button')
      cell.type = 'button'
      cell.className = 'tk__tris-cell'
      cell.dataset.index = String(i)
      cell.setAttribute('role', 'gridcell')
      cell.addEventListener('click', this.onCellClick)
      grid.appendChild(cell)
      this.cells.push(cell)
    }

    const status = document.createElement('div')
    status.className = 'tk__tris-status'
    status.setAttribute('aria-live', 'polite')
    this.statusEl = status

    this.host.appendChild(grid)
    this.host.appendChild(status)
  }

  private teardown(): void {
    if (this.cells.length) this.persist()
    clearTimeout(this.timer)
    this.timer = undefined
    this.cells.forEach(c => c.removeEventListener('click', this.onCellClick))
    this.cells = []
    this.pendingBotMove = false
    if (this.host) this.host.textContent = ''
    this.statusEl = undefined
  }

  /**
   * At most one move is ever scheduled: opening, reply and the end-of-round
   * reset are mutually exclusive, so a single handle is enough.
   */
  private later(fn: () => void, ms: number): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(fn, ms)
  }

  /**
   * Snapshot for the next thinking phase. A finished board is stored cleared, so
   * the next wait opens a new round rather than restoring a dead position the
   * user can't play.
   *
   * Deferred off the current frame: teardown runs during the commit that paints
   * the first token, and a synchronous localStorage write there would block at
   * exactly the moment the answer should appear.
   */
  private persist(): void {
    const game: SavedGame = isOver(this.board)
      ? { board: Array<Mark>(9).fill(''), pendingBotMove: false }
      : { board: [...this.board], pendingBotMove: this.pendingBotMove }
    setTimeout(() => saveGame(game), 0)
  }

  // --- play ------------------------------------------------------------------

  private onCellClick = (e: Event) => {
    const index = Number((e.currentTarget as HTMLButtonElement).dataset.index)
    if (this.locked || Number.isNaN(index) || this.board[index]) return

    this.board[index] = 'x'
    this.paint()
    if (this.finish()) return

    this.pendingBotMove = true
    this.later(() => this.reply(), REPLY_DELAY)
  }

  /** Begin a round with the opponent's move, so the grid is never left empty. */
  private openRound(): void {
    this.pendingBotMove = true
    this.later(() => {
      this.board[this.opening()] = 'o'
      this.pendingBotMove = false
      this.paint()
    }, OPENING_DELAY)
  }

  private reply(): void {
    const move = this.chooseMove()
    if (move >= 0) this.board[move] = 'o'
    this.pendingBotMove = false
    this.paint()
    this.finish()
  }

  /**
   * Varied opening. Always taking the centre would be the strongest move and
   * make every round feel identical; the user already concedes the first move,
   * so mix in edges to keep rounds winnable and different.
   */
  private opening(): number {
    const pool = Math.random() < STRONG_OPENING_RATE ? STRONG : EDGES
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /** Win, else block, else take a good square — with an occasional slip. */
  private chooseMove(): number {
    const free: number[] = []
    this.board.forEach((v, i) => {
      if (!v) free.push(i)
    })
    if (!free.length) return -1

    if (Math.random() > BLUNDER_RATE) {
      const win = this.findGap('o')
      if (win >= 0) return win
      const block = this.findGap('x')
      if (block >= 0) return block
      for (const square of STRONG) {
        if (!this.board[square]) return square
      }
    }
    return free[Math.floor(Math.random() * free.length)]
  }

  /** The empty square that completes a line for `mark`, or -1. */
  private findGap(mark: Mark): number {
    for (const line of LINES) {
      const values = line.map(i => this.board[i])
      const gap = values.indexOf('')
      if (gap >= 0 && values.filter(v => v === mark).length === 2) {
        return line[gap]
      }
    }
    return -1
  }

  /** Returns true when the round is over and a reset has been scheduled. */
  private finish(): boolean {
    const line = winningLine(this.board)
    if (!line && !isFull(this.board)) return false

    if (line) {
      line.forEach(i => this.cells[i].classList.add('tk__tris-cell--win'))
      this.setStatus(this.board[line[0]] === 'x' ? msg('You win') : msg('I win'))
    }
    else {
      this.setStatus(msg('Draw'))
    }

    // Start another round rather than ending on a dead board — the card only
    // lives for a few seconds and there is no score to carry.
    this.later(() => {
      this.board = Array<Mark>(9).fill('')
      this.cells.forEach(c => c.classList.remove('tk__tris-cell--win'))
      this.setStatus('')
      this.paint()
      this.openRound()
    }, RESET_DELAY)
    return true
  }

  // --- render ----------------------------------------------------------------

  private setStatus(text: string): void {
    if (this.statusEl) this.statusEl.textContent = text
  }

  private paint(): void {
    this.cells.forEach((cell, i) => {
      const mark = this.board[i]
      cell.textContent = mark ? (mark === 'x' ? '✕' : '○') : ''
      cell.classList.toggle('tk__tris-cell--x', mark === 'x')
      cell.classList.toggle('tk__tris-cell--o', mark === 'o')
      cell.disabled = !!mark
      const square = i + 1
      cell.setAttribute(
        'aria-label',
        mark === 'x'
          ? msg(str`Square ${square}, yours`)
          : mark === 'o'
            ? msg(str`Square ${square}, mine`)
            : msg(str`Square ${square}, empty`)
      )
    })
  }
}

export const trisGame = directive(TrisGameDirective)
