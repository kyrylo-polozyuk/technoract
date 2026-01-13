import type { PrimitiveField } from "@audiotool/nexus/document"
import { useContext, useEffect, useState } from "react"
import { DrumPatternButton } from "../buttons/DrumPatternButton"
import { SynthButton } from "../buttons/SyncButton"
import {
  ORDERED_SAMPLE_KEYS,
  SAMPLE_SHORTCUTS,
  SYNTH_SHORTCUTS,
} from "../const"
import { AudiotoolContext } from "../context"
import { useDialog } from "../dialog/useDialog"
import { createKeyboardShortcutHandler } from "../hooks/useKeyboardShortcut"
import {
  clearTechnoStateFromLocalStorage,
  loadTechnoStateFromLocalStorage,
  saveTechnoStateToLocalStorage,
} from "../state-persistence"
import type { TechnoState } from "../types"
import { NOTES } from "./const"
import type { GeneratorService } from "./service"

export const Generator = (props: {
  service: GeneratorService
  projectUrl: string
}) => {
  const context = useContext(AudiotoolContext)
  const [technoState, setTechnoState] = useState<TechnoState | undefined>()
  const { showDialog, closeDialog } = useDialog()

  useEffect(() => {
    if (props.projectUrl && context.nexus) {
      loadTechnoStateFromLocalStorage(context.nexus, props.projectUrl).then(
        (technoState) => {
          if (technoState !== undefined) {
            props.service.setTechnoState(technoState)
          }
        },
      )
    }
  }, [context.nexus, props.projectUrl])

  useEffect(() => {
    return props.service.subscribeToTechnoStateChanges((technoState) => {
      if (technoState !== undefined) {
        saveTechnoStateToLocalStorage(technoState, props.projectUrl)
        setTechnoState({ ...technoState })
      } else {
        clearTechnoStateFromLocalStorage(props.projectUrl)
        setTechnoState(undefined)
      }
    })
  }, [props.service])

  // Show welcome dialog on first mount
  useEffect(() => {
    const projectUrl = props.projectUrl

    showDialog({
      id: "generator-welcome",
      title: "Getting Started",
      content: (
        <div className="column start">
          <p>To hear the output of the Technoract:</p>
          <ol>
            <li>
              Open currently connected project in{" "}
              <a href={projectUrl} target="_blank">
                Audiotool Studio{" "}
                <span className="material-symbols-outlined">open_in_new</span>
              </a>{" "}
              if you haven't already
            </li>
            <li>In the Studio:</li>
            <ul>
              <li>
                Press <strong>Play</strong>{" "}
                <span className="material-symbols-outlined">play_arrow</span>
              </li>
              <li>
                Turn on <strong>Loop</strong>{" "}
                <span className="material-symbols-outlined">loop</span> to keep
                it playing indefinitely
              </li>
              <li>Adjust the tempo to your liking</li>
            </ul>
            <li>Press Randomize to create a new Technoract</li>
          </ol>
        </div>
      ),
      dismissible: true,
      buttons: [
        {
          label: "Got it",
          variant: "primary",
          onClick: () => closeDialog("generator-welcome"),
        },
      ],
    })
  }, [showDialog, closeDialog, props.projectUrl])

  // Handle spacebar press to randomize
  useEffect(() => {
    return createKeyboardShortcutHandler(" ", () =>
      props.service.randomizeAll(),
    )
  }, [context.nexus, props.service])

  useEffect(() => {
    return createKeyboardShortcutHandler("s", () =>
      props.service.randomizeNotes(),
    )
  }, [context.nexus, props.service])

  // Sync animation duration with BPM
  useEffect(() => {
    if (context.nexus === undefined) {
      // Reset to default if no nexus
      document.documentElement.style.setProperty(
        "--title-animation-duration",
        "10s",
      )
      return
    }

    let tempoBpmField: PrimitiveField<number, "mut"> | undefined
    let unsubscribe: { terminate: () => void } | undefined

    const updateVariable = (tempoBpm: number) => {
      const durationSeconds = (60 / tempoBpm) * 4 * 16
      document.documentElement.style.setProperty(
        "--title-animation-duration",
        `${durationSeconds}s`,
      )
    }

    // Get config entity and set up subscription
    context.nexus.modify((t) => {
      const config = t.entities.ofTypes("config").getOne()

      if (config !== undefined) {
        tempoBpmField = config.fields.tempoBpm
        updateVariable(tempoBpmField.value)

        // Subscribe to tempoBpm field changes if we found the config
        if (tempoBpmField !== undefined) {
          unsubscribe?.terminate()
          unsubscribe = context.nexus?.events.onUpdate(
            tempoBpmField,
            (value) => {
              updateVariable(value)
            },
          )
        }
      }
    })

    return () => {
      unsubscribe?.terminate()
    }
  }, [context.nexus])

  const renderDrumButtons = (technoState: TechnoState | undefined) => {
    if (technoState === undefined) {
      return <></>
    } else {
      return (
        <div className="column">
          <p>Drums</p>
          {ORDERED_SAMPLE_KEYS.map((sampleKey) => (
            <DrumPatternButton
              key={sampleKey}
              sampleKey={sampleKey}
              technoState={technoState}
              onRandomize={() => props.service.randomizeDrum(sampleKey)}
              onClear={() => props.service.clearDrum(sampleKey)}
              shortcut={SAMPLE_SHORTCUTS[sampleKey]}
            ></DrumPatternButton>
          ))}
        </div>
      )
    }
  }

  const renderSynthButtons = (technoState: TechnoState | undefined) => {
    if (technoState === undefined) {
      return <></>
    } else {
      return (
        <div className="column">
          <p>Synths</p>
          <SynthButton
            technoState={technoState}
            label="Bass"
            stateKey="bassMidiEntities"
            onClick={() => props.service.randomizeBass()}
            onClear={() => props.service.clearBass()}
            shortcut={SYNTH_SHORTCUTS.bassMidiEntities}
          ></SynthButton>
          <SynthButton
            technoState={technoState}
            label="Pad"
            stateKey="padMidiEntities"
            onClick={() => props.service.randomizePad()}
            onClear={() => props.service.clearPad()}
            shortcut={SYNTH_SHORTCUTS.padMidiEntities}
          ></SynthButton>
          <button onClick={() => props.service.randomizeNotes()}>
            <span className="material-symbols-outlined">piano</span>
            <span className="label">
              Notes
              <span className="secondary-text shortcut">s</span>
            </span>
            <span>{NOTES[technoState.rootNote % 12] + " Minor"}</span>
          </button>
        </div>
      )
    }
  }

  return (
    <div className="column grow full-width">
      <div className="row">
        <button
          className="primary"
          onClick={() => {
            props.service.randomizeAll()
          }}
          disabled={context.nexus === undefined}
        >
          <span className="material-symbols-outlined">instant_mix</span>
          Randomize
        </button>
      </div>

      {technoState === undefined ? (
        <>
          <div className="column grow">
            <blockquote>
              Project is empty. Click <strong>Randomize</strong> or press{" "}
              <strong>Space</strong> to begin.
            </blockquote>
          </div>
          <div className="column grow"></div>
        </>
      ) : (
        <div className="row full-width grow">
          {renderSynthButtons(technoState)}
          {renderDrumButtons(technoState)}
        </div>
      )}

      <div className="row">
        <button
          className="reset-button hug"
          onClick={() => {
            showDialog({
              id: "clear-all-confirmation",
              title: "Are you sure?",
              content: (
                <p>
                  This will clear the entire project. This action cannot be
                  undone.
                </p>
              ),
              dismissible: true,
              buttons: [
                {
                  label: "Cancel",
                  onClick: () => closeDialog("clear-all-confirmation"),
                },
                {
                  label: "Clear All",
                  variant: "primary",
                  onClick: () => {
                    props.service?.clearAll()
                    closeDialog("clear-all-confirmation")
                  },
                },
              ],
            })
          }}
        >
          <span className="material-symbols-outlined">close</span>
          <span>Clear All</span>
        </button>
      </div>
    </div>
  )
}
