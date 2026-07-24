import { noChange, nothing } from 'lit'
import {
  AsyncDirective,
  directive,
  DirectiveParameters,
  ElementPart,
  PartInfo,
  PartType,
} from 'lit/async-directive.js'

/** ms per character while typing a phrase in */
const TYPE_SPEED = 55
/** ms per character while erasing (faster than typing) */
const ERASE_SPEED = 28
/** how long a fully-typed phrase stays before erasing */
const HOLD_DURATION = 1000
/** pause between erasing one phrase and typing the next */
const GAP_DURATION = 350
/** with reduced motion: how long each full phrase stays before swapping */
const REDUCED_HOLD = 2500

/**
 * Drives an <input>'s placeholder as a rotating typewriter: types each phrase
 * one character at a time, holds ~1s, erases it, then types the next — looping.
 * Signals to the user that the askbar is where they ask questions.
 *
 * Element-part directive on the input. It fully owns `.placeholder`, so the
 * input must NOT also bind the placeholder attribute (they would fight each
 * render). When `phrases` is empty it just parks `fallback` in the placeholder.
 *
 * Pauses while the field has text (placeholder is hidden anyway) and resumes
 * when it is cleared. AsyncDirective so the loop is torn down when the
 * askbar leaves the DOM — which happens the moment the window opens.
 */
class TypingPlaceholderDirective extends AsyncDirective {
  private el?: HTMLInputElement
  private phrases: string[] = []
  private fallback = ''
  private index = 0
  private timer?: ReturnType<typeof setTimeout>
  private disposed = false
  private onInput?: () => void

  constructor(partInfo: PartInfo) {
    super(partInfo)
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        'typingPlaceholder must be used as an element-part directive'
      )
    }
  }

  // Rendering happens imperatively in update(); this satisfies the signature.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(phrases: string[], fallback: string): typeof nothing {
    return nothing
  }

  update(
    part: ElementPart,
    [phrases, fallback]: DirectiveParameters<this>
  ): typeof noChange {
    const el = part.element as HTMLInputElement

    const phrasesChanged =
      phrases.length !== this.phrases.length ||
      phrases.some((p, i) => p !== this.phrases[i])

    if (el !== this.el) {
      this.el = el
      this.attachListeners()
    }

    this.fallback = fallback

    if (phrasesChanged) {
      this.phrases = phrases
      this.index = 0
      this.restart()
    }

    return noChange
  }

  private attachListeners(): void {
    if (!this.el) return
    this.onInput = () => {
      // Placeholder is hidden while there's text — stop churning it, and
      // resume from the top once the field is cleared again.
      if (this.el?.value) {
        this.stop()
      } else {
        this.index = 0
        this.restart()
      }
    }
    this.el.addEventListener('input', this.onInput)
  }

  private restart(): void {
    this.stop()
    if (!this.el || this.el.value) return

    if (!this.phrases.length) {
      this.el.placeholder = this.fallback
      return
    }

    this.disposed = false

    if (prefersReducedMotion()) {
      this.el.placeholder = this.phrases[this.index] ?? this.fallback
      if (this.phrases.length > 1) {
        this.timer = setTimeout(() => this.reducedNext(), REDUCED_HOLD)
      }
      return
    }

    this.el.placeholder = ''
    this.type(0)
  }

  /** Reduced motion: swap whole phrases, no per-character animation. */
  private reducedNext(): void {
    if (this.disposed || !this.el) return
    this.index = (this.index + 1) % this.phrases.length
    this.el.placeholder = this.phrases[this.index] ?? this.fallback
    this.timer = setTimeout(() => this.reducedNext(), REDUCED_HOLD)
  }

  /** Type the current phrase in, one character at a time. */
  private type(charCount: number): void {
    if (this.disposed || !this.el) return
    const phrase = this.phrases[this.index] ?? ''

    if (charCount <= phrase.length) {
      this.el.placeholder = phrase.slice(0, charCount)
      this.timer = setTimeout(() => this.type(charCount + 1), TYPE_SPEED)
      return
    }

    // Fully typed — hold, then erase (unless it's the only phrase: just hold).
    if (this.phrases.length < 2) return
    this.timer = setTimeout(() => this.erase(phrase.length), HOLD_DURATION)
  }

  /** Erase the current phrase, then advance to the next one. */
  private erase(charCount: number): void {
    if (this.disposed || !this.el) return
    const phrase = this.phrases[this.index] ?? ''

    if (charCount >= 0) {
      this.el.placeholder = phrase.slice(0, charCount)
      this.timer = setTimeout(() => this.erase(charCount - 1), ERASE_SPEED)
      return
    }

    this.index = (this.index + 1) % this.phrases.length
    this.timer = setTimeout(() => this.type(0), GAP_DURATION)
  }

  private stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  protected disconnected(): void {
    this.disposed = true
    this.stop()
    if (this.el && this.onInput) {
      this.el.removeEventListener('input', this.onInput)
    }
  }

  protected reconnected(): void {
    this.attachListeners()
    this.restart()
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const typingPlaceholder = directive(TypingPlaceholderDirective)
