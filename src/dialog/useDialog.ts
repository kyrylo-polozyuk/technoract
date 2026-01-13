import { useCallback } from "react"
import type { DialogConfig } from "./Dialog"
import { useDialogContext } from "./DialogContext"

export const useDialog = () => {
  const { showDialog, closeDialog, closeAllDialogs } = useDialogContext()

  const show = useCallback(
    (config: Omit<DialogConfig, "id"> & { id?: string }) => {
      const id = config.id || `dialog-${Date.now()}-${Math.random()}`
      showDialog({ ...config, id })
      return id
    },
    [showDialog],
  )

  const close = useCallback(
    (id: string) => {
      closeDialog(id)
    },
    [closeDialog],
  )

  return {
    showDialog: show,
    closeDialog: close,
    closeAllDialogs,
  }
}
