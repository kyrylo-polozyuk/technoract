import { useEffect, useRef } from "react"
import { useDialog } from "./dialog/useDialog"

// Component to handle uncaught errors and show uncloseable dialog
export const ErrorHandler = () => {
  const { showDialog } = useDialog()
  const errorShownRef = useRef(false)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (!errorShownRef.current) {
        errorShownRef.current = true
        showDialog({
          id: "uncaught-error",
          title: "An unexpected error occurred",
          content: (
            <div>
              <p>
                The application encountered an unexpected error. Please refresh
                the page to continue.
              </p>
              <p className="error">Error: {event.message || "Unknown error"}</p>
            </div>
          ),
          dismissible: false,
          closeOnBackdropClick: false,
          buttons: [
            {
              label: "Refresh Page",
              variant: "primary",
              onClick: () => {
                window.location.reload()
              },
            },
          ],
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!errorShownRef.current) {
        errorShownRef.current = true
        const errorMessage =
          event.reason?.message || event.reason || "Unknown error"
        showDialog({
          id: "uncaught-error",
          title: "An unexpected error occurred",
          content: (
            <div>
              <p>
                The application encountered an unexpected error. Please refresh
                the page to continue.
              </p>
              <p className="error">Error: {String(errorMessage)}</p>
            </div>
          ),
          dismissible: false,
          closeOnBackdropClick: false,
          buttons: [
            {
              label: "Refresh Page",
              variant: "primary",
              onClick: () => {
                window.location.reload()
              },
            },
          ],
        })
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [showDialog])

  return null
}
