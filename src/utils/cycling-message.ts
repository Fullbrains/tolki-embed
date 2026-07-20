import { noChange, nothing } from 'lit'
import {
  AsyncDirective,
  directive,
  DirectiveParameters,
  ElementPart,
  PartInfo,
  PartType,
} from 'lit/async-directive.js'

/** How long each message stays fully visible before sliding out */
const HOLD_DURATION = 2200
/** Duration of each slide (in and out) */
const SLIDE_DURATION = 450

const ENTER_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(100%)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 },
]
const EXIT_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(0)', opacity: 1 },
  { transform: 'translateY(-100%)', opacity: 0 },
]
const SLIDE_OPTIONS: KeyframeAnimationOptions = {
  duration: SLIDE_DURATION,
  easing: 'ease-in-out',
  fill: 'forwards',
}

/**
 * Cycles through a list of strings inside a host element, showing one at a
 * time: it slides up from below, holds, then slides out through the top while
 * the next one slides in.
 *
 * The whole sequence is driven by the Web Animations API rather than CSS
 * keyframes + a JS timer. A single controller (this directive) owns both the
 * timing and the motion, so there is nothing to keep in sync: each step waits
 * on the previous animation's `finished` promise before starting the next.
 *
 * AsyncDirective so the loop is torn down when the thinking indicator leaves
 * the DOM — which happens on every first text_delta.
 */
class CyclingMessageDirective extends AsyncDirective {
  private host?: HTMLElement
  private textEl?: HTMLSpanElement
  private messages: string[] = []
  private index = 0
  private timer?: ReturnType<typeof setTimeout>
  private running = false
  private disposed = false

  constructor(partInfo: PartInfo) {
    super(partInfo)
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('cyclingMessage must be used as an element-part directive')
    }
  }

  // The real rendering happens imperatively in update(); this only satisfies
  // the abstract signature and fixes the directive's parameter types.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(messages: string[]): typeof nothing {
    return nothing
  }

  update(part: ElementPart, [messages]: DirectiveParameters<this>): typeof noChange {
    const host = part.element as HTMLElement

    const messagesChanged =
      messages.length !== this.messages.length ||
      messages.some((m, i) => m !== this.messages[i])

    if (host !== this.host) {
      this.host = host
      this.mountText()
    }

    if (messagesChanged) {
      this.messages = messages
      this.index = 0
      this.restart()
    }

    return noChange
  }

  /** Build the single reused text span inside the host */
  private mountText(): void {
    if (!this.host) return
    this.host.textContent = ''
    const span = document.createElement('span')
    span.className = 'tk__thinking-message'
    this.host.appendChild(span)
    this.textEl = span
  }

  private restart(): void {
    this.stop()
    if (!this.textEl || !this.messages.length) return

    this.disposed = false
    this.running = true
    this.textEl.textContent = this.messages[0] ?? ''

    // A single message just fades in and stays — no cycling.
    this.animate(this.textEl, ENTER_KEYFRAMES)
    if (this.messages.length < 2) {
      this.running = false
      return
    }

    this.scheduleNext()
  }

  private scheduleNext(): void {
    this.timer = setTimeout(() => {
      void this.advance()
    }, HOLD_DURATION)
  }

  /** Slide the current message out, swap the text, slide the next one in */
  private async advance(): Promise<void> {
    if (this.disposed || !this.textEl) return

    const exit = this.animate(this.textEl, EXIT_KEYFRAMES)
    if (exit) {
      try {
        await exit.finished
      }
      catch {
        // animation was cancelled (e.g. teardown) — bail out quietly
        return
      }
    }
    if (this.disposed || !this.textEl) return

    this.index = (this.index + 1) % this.messages.length
    this.textEl.textContent = this.messages[this.index] ?? ''
    this.animate(this.textEl, ENTER_KEYFRAMES)

    this.scheduleNext()
  }

  /**
   * Run a WAAPI animation if supported; otherwise leave the element in its
   * final visual state so the text is always readable without motion.
   */
  private animate(el: HTMLElement, keyframes: Keyframe[]): Animation | undefined {
    if (typeof el.animate !== 'function' || prefersReducedMotion()) {
      // No motion: land on the last keyframe's opacity/transform statically.
      const last = keyframes[keyframes.length - 1] as Record<string, string>
      el.style.opacity = String(last.opacity ?? 1)
      el.style.transform = String(last.transform ?? 'none')
      return undefined
    }
    return el.animate(keyframes, SLIDE_OPTIONS)
  }

  private stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.textEl?.getAnimations().forEach((a) => a.cancel())
    this.running = false
  }

  protected disconnected(): void {
    this.disposed = true
    this.stop()
  }

  protected reconnected(): void {
    if (!this.running && this.messages.length) {
      this.restart()
    }
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const cyclingMessage = directive(CyclingMessageDirective)
