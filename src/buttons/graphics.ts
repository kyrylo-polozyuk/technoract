import { Ticks } from "@audiotool/nexus"
import { KICK_LOOP_DURATION_CONFIG } from "../pattern-util"
import type { MidiEntities } from "../types"

export const CANVAS_PADDING = 4
export const CANVAS_WIDTH =
  KICK_LOOP_DURATION_CONFIG.max * 4 * 4 + CANVAS_PADDING * 2
export const CANVAS_HEIGHT = 16

export const prepareCanvas = (
  canvasElement: HTMLCanvasElement,
  renderingContext: CanvasRenderingContext2D,
  midiEntities: MidiEntities,
) => {
  // update size
  canvasElement.style.width = `${CANVAS_WIDTH}px`
  canvasElement.style.height = `${CANVAS_HEIGHT}px`
  canvasElement.width = CANVAS_WIDTH * window.devicePixelRatio
  canvasElement.height = CANVAS_HEIGHT * window.devicePixelRatio

  const widthTicks =
    KICK_LOOP_DURATION_CONFIG.granularity * KICK_LOOP_DURATION_CONFIG.max
  const ticksPerPx = widthTicks / (canvasElement.width - CANVAS_PADDING * 2)

  const loopDurationPx =
    midiEntities.region.fields.region.fields.loopDurationTicks.value /
    ticksPerPx

  // clear
  renderingContext.clearRect(0, 0, canvasElement.width, canvasElement.height)

  const xOffset = canvasElement.width - CANVAS_PADDING * 2 - loopDurationPx

  // mask
  renderingContext.beginPath()
  renderingContext.roundRect(
    xOffset,
    0,
    loopDurationPx + CANVAS_PADDING * 2,
    canvasElement.height,
    canvasElement.height / 2,
  )
  renderingContext.clip()

  // bg
  renderingContext.beginPath()
  renderingContext.fillStyle = "#ffffff20"
  renderingContext.rect(
    xOffset,
    0,
    loopDurationPx + CANVAS_PADDING * 2,
    canvasElement.height,
  )
  renderingContext.fill()
  renderingContext.beginPath()
  renderingContext.fillStyle = "#ffffff0f"
  for (
    let i = 0;
    i <
    midiEntities.region.fields.region.fields.loopDurationTicks.value /
      (Ticks.SemiQuaver * 4);
    i++
  ) {
    if (i % 2 === 1) {
      continue
    }
    renderingContext.rect(
      xOffset +
        Math.round(CANVAS_PADDING + (i * (Ticks.SemiQuaver * 4)) / ticksPerPx),
      0,
      Math.round((Ticks.SemiQuaver * 4) / ticksPerPx),
      canvasElement.height,
    )
  }
  renderingContext.fill()

  return { ticksPerPx, xOffset }
}
