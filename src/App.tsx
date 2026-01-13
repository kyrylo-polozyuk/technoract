import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useEffect, useState } from "react"
import projectIcon from "./assets/technoract.svg"
import { AudiotoolContext } from "./context"
import { DialogProvider } from "./dialog/DialogContext"
import { ErrorBoundary } from "./ErrorBoundary"
import { ErrorHandler } from "./ErrorHandler"
import { Generator } from "./generator/Generator"
import { GeneratorService } from "./generator/service"
import { useAuth } from "./hooks/useAuth"
import { LoginScreen } from "./LoginScreen"
import { ProjectSelector } from "./project-selector/ProjectSelector"
import { Visualiser } from "./tesseract/Visualiser"

export const App = () => {
  const { loginStatus, authStatus, loading, authError } = useAuth()

  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined)
  const [nexus, setNexus] = useState<SyncedDocument | undefined>(undefined)
  const [projectUrl, setProjectUrl] = useState<string>("")
  const [service, setService] = useState<GeneratorService | undefined>(
    undefined,
  )

  // create generator service when client and nexus are connected
  useEffect(() => {
    if (client !== undefined && nexus !== undefined) {
      setService(new GeneratorService({ client, nexus }))
    } else {
      setService(undefined)
    }
  }, [client, nexus])

  // Read projectUrl from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get("projectUrl")
    if (urlParam) {
      setProjectUrl(urlParam)
    }
  }, [])

  const handleLogout = async () => {
    if (loginStatus?.loggedIn !== true) {
      return
    }

    // Clear client and nexus connections
    setNexus(undefined)
    setClient(undefined)
    setService(undefined)

    // Clear project URL
    setProjectUrl("")

    // Clear URL parameters
    window.history.replaceState({}, "", window.location.pathname)

    loginStatus?.logout()
  }

  // Extract project ID from URL or return as-is if it's already just an ID
  // (kept here for use in "Open Studio" button)
  const extractProjectId = (input: string): string => {
    const trimmed = input.trim()

    // If it's already just an ID (no URL structure), return as-is
    if (
      !trimmed.includes("://") &&
      !trimmed.includes("/") &&
      !trimmed.includes("?")
    ) {
      return trimmed
    }

    try {
      const url = new URL(trimmed)
      // Check for project parameter in query string
      const projectParam = url.searchParams.get("project")
      if (projectParam) {
        return projectParam
      }

      // Check if the pathname contains a project ID (e.g., /studio/PROJECT_ID or /project/PROJECT_ID)
      const pathParts = url.pathname.split("/").filter(Boolean)
      const projectIndex = pathParts.findIndex(
        (part) => part === "studio" || part === "project",
      )
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        return pathParts[projectIndex + 1]
      }

      // If no project found in URL, return the last path segment as fallback
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1]
      }
    } catch {
      // If URL parsing fails, assume it's already a project ID
      return trimmed
    }

    // Fallback: return trimmed input
    return trimmed
  }

  const handleProjectConnected = (
    client: AudiotoolClient,
    nexus: SyncedDocument,
    projectUrl: string,
  ) => {
    setClient(client)
    setNexus(nexus)
    setProjectUrl(projectUrl)
  }

  const getAppContents = (): React.ReactNode => {
    // Don't show project connection if not logged in (LoginScreen handles that)
    if (authStatus !== "logged-in") {
      return null
    }

    // Show project connection screen if authenticated but not connected
    if (nexus === undefined) {
      return (
        <ProjectSelector
          loginStatus={loginStatus}
          onProjectConnected={handleProjectConnected}
          projectUrl={projectUrl}
          onProjectUrlChange={setProjectUrl}
        />
      )
    }

    // connected to a project, start the generator
    if (service !== undefined) {
      return <Generator service={service} projectUrl={projectUrl}></Generator>
    }

    return null
  }

  return (
    <DialogProvider>
      <ErrorHandler />
      <ErrorBoundary>
        <AudiotoolContext.Provider value={{ client, nexus }}>
          {nexus !== undefined &&
            client !== undefined &&
            service !== undefined && (
              <Visualiser service={service}></Visualiser>
            )}
          <div className="column full-height app-container">
            <div className="row full-width top-bar blur">
              <div className="title-container">
                <img src={projectIcon} alt="" width="24" height="24" />
                <p className="title">Technoract</p>
              </div>
              {authStatus === "logged-in" && (
                <div className="user-info">
                  {nexus && client && projectUrl && (
                    <>
                      <button
                        className="hug"
                        onClick={() => {
                          const params = new URLSearchParams(
                            window.location.search,
                          )
                          params.delete("projectUrl")
                          window.history.replaceState(
                            {},
                            "",
                            `${window.location.pathname}?${params.toString()}`,
                          )
                          setClient(undefined)
                          setNexus(undefined)
                        }}
                      >
                        <span className="material-symbols-outlined">
                          arrow_back
                        </span>
                        <span>Change Project</span>
                      </button>
                      <button
                        className="hug open-studio-button"
                        onClick={() => {
                          const projectId = extractProjectId(projectUrl)
                          window.open(
                            `https://beta.audiotool.com/studio?project=${projectId}`,
                            "_blank",
                          )
                        }}
                      >
                        <span className="material-symbols-outlined">
                          play_arrow
                        </span>
                        <span>Open Studio</span>
                      </button>
                    </>
                  )}
                  {/* <span>{userName}</span> */}
                  <button className="hug" onClick={handleLogout}>
                    <span className="material-symbols-outlined">logout</span>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
            <div className="column grow full-width">
              <LoginScreen
                loginStatus={loginStatus}
                authStatus={authStatus}
                loading={loading}
                authError={authError}
              />
              {getAppContents()}
            </div>
            <div className="row full-width blur">
              <p>
                Created by{" "}
                <a href="https://www.audiotool.com/user/kepz" target="_blank">
                  Kepz
                </a>
                . Using{" "}
                <a href="https://developer.audiotool.com/" target="_blank">
                  Audiotool SDK
                </a>
              </p>
            </div>
          </div>
        </AudiotoolContext.Provider>
      </ErrorBoundary>
    </DialogProvider>
  )
}
