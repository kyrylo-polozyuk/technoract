import { useContext, useEffect, useRef, useState } from "react"
import { AudiotoolContext } from "../context"
import { createKeyboardShortcutHandler } from "../hooks/useKeyboardShortcut"
import type { TechnoState } from "../types"
import {
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  CANVAS_WIDTH,
  prepareCanvas,
} from "./graphics"

export const SynthButton = ({
  technoState,
  label,
  stateKey,
  onClick,
  onClear,
  shortcut,
}: {
  technoState: TechnoState
  label: string
  stateKey: "padMidiEntities" | "bassMidiEntities"
  onClick: () => void
  onClear: () => void
  shortcut?: string
}) => {
  const context = useContext(AudiotoolContext)
  const [midiEntities, setMidiEntities] = useState(technoState[stateKey])
  const canvasElement = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setMidiEntities({ ...technoState[stateKey] })
  }, [technoState, stateKey])

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

    return createKeyboardShortcutHandler(shortcut, onClick)
  }, [shortcut, onClick, context.nexus])

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
        .sort((a, b) => a.fields.pitch.value - b.fields.pitch.value)
      const rootPitch = notes.at(0)?.fields.pitch.value ?? 0

      const maxPitchDiff = (notes.at(-1)?.fields.pitch.value ?? 0) - rootPitch

      renderingContext.beginPath()
      renderingContext.fillStyle = "#ffffff"
      const noteHeightPx = Math.min(
        4,
        Math.max(
          1,
          (canvasElement.current.height - CANVAS_PADDING * 2) /
            (maxPitchDiff + 1),
        ),
      )

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        const pitchDiff = note.fields.pitch.value - rootPitch
        renderingContext.roundRect(
          xOffset +
            Math.round(
              CANVAS_PADDING + note.fields.positionTicks.value / ticksPerPx,
            ),
          Math.round(
            CANVAS_PADDING + noteHeightPx * (maxPitchDiff - pitchDiff),
          ),
          Math.round(note.fields.durationTicks.value / ticksPerPx) - 1,
          Math.round(noteHeightPx),
          Math.round(noteHeightPx),
        )
      }
      renderingContext.fill()
    })
  }, [midiEntities, context.nexus, canvasElement.current])

  return (
    <button
      onClick={(event) => {
        if (event.ctrlKey) {
          onClear()
        } else {
          onClick()
        }
      }}
    >
      <span className="material-symbols-outlined">refresh</span>
      <span className="label">
        {label}
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
