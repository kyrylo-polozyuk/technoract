import React, { Component, type ReactNode } from "react"
import { useDialogContext } from "./dialog/DialogContext"

type ErrorBoundaryProps = {
  children: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

// Wrapper component to provide dialog context to Error Boundary
export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>
}

// Inner class component that can access dialog context via render prop pattern
class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render a component that can use hooks to show dialog
      return <ErrorBoundaryDialog error={this.state.error} />
    }

    return this.props.children
  }
}

// Component that uses hooks to show the error dialog
const ErrorBoundaryDialog = ({ error }: { error: Error | null }) => {
  const { showDialog } = useDialogContext()
  const errorShownRef = React.useRef(false)

  React.useEffect(() => {
    if (!errorShownRef.current && error) {
      errorShownRef.current = true
      showDialog({
        id: "react-error-boundary",
        title: "An unexpected error occurred",
        content: (
          <div>
            <p>
              The application encountered an unexpected error. Please refresh
              the page to continue.
            </p>
            <p className="error">Error: {error.message || "Unknown error"}</p>
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
  }, [showDialog, error])

  return null
}
