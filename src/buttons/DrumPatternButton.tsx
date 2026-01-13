import { useContext, useEffect, useRef, useState } from "react"
import { AudiotoolContext } from "../context"
import { createKeyboardShortcutHandler } from "../hooks/useKeyboardShortcut"
import type { SampleKey, TechnoState } from "../types"
import {
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  CANVAS_WIDTH,
  prepareCanvas,
} from "./graphics"

export const DrumPatternButton = ({
  sampleKey,
  technoState,
  onRandomize,
  onClear,
  shortcut,
}: {
  sampleKey: SampleKey
  technoState: TechnoState
  onRandomize: () => void
  onClear: () => void
  shortcut?: string
}) => {
  const context = useContext(AudiotoolContext)
  const [midiEntities, setMidiEntities] = useState(
    technoState.machinisteMidiEntities.tracksAndRegions[sampleKey],
  )
  const canvasElement = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setMidiEntities({
      ...technoState.machinisteMidiEntities.tracksAndRegions[sampleKey],
    })
  }, [sampleKey, technoState])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!shortcut || context.nexus === undefined) {
      return
    }

    return createKeyboardShortcutHandler(
      shortcut,
      (event) => {
        event.stopImmediatePropagation()
        onClear()
      },
      ["Control"],
    )
  }, [shortcut, onClear, context.nexus])

  useEffect(() => {
    if (!shortcut || context.nexus === undefined) {
      return
    }

    return createKeyboardShortcutHandler(shortcut, onRandomize)
  }, [shortcut, onRandomize, context.nexus])

  useEffect(() => {
    if (context.nexus === undefined) {
      return
    }

    context.nexus.modify((t) => {
      if (canvasElement.current == null) {
        return
      }

      const renderingContext = canvasElement.current.getContext("2d")

      if (renderingContext == null) {
        return
      }

      const { ticksPerPx, xOffset } = prepareCanvas(
        canvasElement.current,
        renderingContext,
        midiEntities,
      )

      // notes
      const notes = t.entities
        .ofTypes("note")
        .pointingTo.locations(midiEntities.collection.location)
        .get()

      renderingContext.beginPath()
      renderingContext.fillStyle = "#ffffff"

      const noteSize = canvasElement.current.height / 4 - 1
      for (const note of notes) {
        renderingContext.roundRect(
          xOffset +
            Math.round(
              CANVAS_PADDING + note.fields.positionTicks.value / ticksPerPx,
            ),
          Math.round((canvasElement.current.height - noteSize) / 2),
          Math.round(noteSize),
          Math.round(noteSize),
          Math.round(noteSize),
        )
      }
      renderingContext.fill()
    })
  }, [midiEntities, context.nexus, canvasElement])

  return (
    <button
      onClick={(event) => {
        if (event.ctrlKey) {
          onClear()
        } else {
          onRandomize()
        }
      }}
    >
      <span className="material-symbols-outlined">refresh</span>
      <span className="label">
        {sampleKey.replace("_", " ")}
        {shortcut && (
          <span className="secondary-text shortcut">{shortcut}</span>
        )}
      </span>
      <canvas
        ref={canvasElement}
        height={`${CANVAS_HEIGHT}px`}
        width={`${CANVAS_WIDTH}px`}
      ></canvas>
    </button>
  )
}
