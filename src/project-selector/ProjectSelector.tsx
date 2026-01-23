import type { LoginStatus } from "@audiotool/nexus"
import {
  createAudiotoolClient,
  type AudiotoolClient,
  type SyncedDocument,
} from "@audiotool/nexus"
import { useCallback, useEffect, useState } from "react"
import { extractProjectId } from "../state-persistence"
import { ProjectList } from "./ProjectList"
import "./ProjectSelector.css"

interface ProjectSelectorProps {
  loginStatus: LoginStatus | undefined
  onProjectConnected: (
    client: AudiotoolClient,
    syncedDocument: SyncedDocument,
    projectUrl: string,
  ) => void
  onProjectUrlChange: (projectUrl: string) => void
  projectUrl?: string
}

export const ProjectSelector = ({
  loginStatus,
  onProjectConnected,
  onProjectUrlChange,
  projectUrl,
}: ProjectSelectorProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined)
  const [showProjectList, setShowProjectList] = useState<boolean>(false)

  const connectToProject = useCallback(
    async (urlToUse: string) => {
      if (!urlToUse || urlToUse.trim().length === 0) {
        setError("Project URL is required")
        return
      }
      const currentUrl = urlToUse

      if (!client) {
        setError("Client not initialized")
        return
      }

      setLoading(true)
      setError(undefined)

      // Extract project ID from URL
      const projectId = extractProjectId(currentUrl)

      // Update URL parameter (store the original input)
      const params = new URLSearchParams(window.location.search)
      params.set("projectUrl", currentUrl.trim())
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`,
      )

      try {
        const syncedDocument = await client.createSyncedDocument({
          mode: "online",
          project: projectId,
        })

        // Start syncing
        await syncedDocument.start()
        onProjectConnected(client, syncedDocument, currentUrl.trim())
        setLoading(false)
      } catch (e) {
        setLoading(false)
        if (typeof e === "string") {
          setError(e)
        } else if (e instanceof Error) {
          setError(e.message)
        }
      }
    },
    [client, onProjectConnected],
  )

  const handleProjectSelected = (projectId: string) => {
    const projectUrl = `https://beta.audiotool.com/studio?project=${projectId}`
    window.open(
      `https://beta.audiotool.com/studio?project=${projectId}`,
      "_blank",
    )
    void connectToProject(projectUrl)
  }

  // Create client on mount when loginStatus is available
  useEffect(() => {
    if (!loginStatus || loginStatus.loggedIn === false) {
      return
    }

    const initializeClient = async () => {
      try {
        const audiotoolClient = await createAudiotoolClient({
          authorization: loginStatus,
        })
        setClient(audiotoolClient)
      } catch (e) {
        if (typeof e === "string") {
          setError(e)
        } else if (e instanceof Error) {
          setError(e.message)
        }
      }
    }

    void initializeClient()
  }, [loginStatus])

  useEffect(() => {
    // if projectUrl in URL matches the projectUrl prop and client is connected, automatically connect to the project
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get("projectUrl")
    if (urlParam === projectUrl && client !== undefined && urlParam) {
      void connectToProject(urlParam)
    }
  }, [client, projectUrl, connectToProject])

  const createNewProject = async () => {
    setLoading(true)
    setError(undefined)

    const response = await client?.api.projectService.createProject({
      project: {
        displayName: "Technoract",
      },
    })

    if (response instanceof Error) {
      setError(response.message)
      return
    }

    if (response?.project === undefined) {
      return
    }

    const projectId = response.project.name.replace("projects/", "")
    const projectUrl = `https://beta.audiotool.com/studio?project=${projectId}`
    onProjectUrlChange(projectUrl)
    window.open(
      `https://beta.audiotool.com/studio?project=${projectId}`,
      "_blank",
    )
    void connectToProject(projectUrl)
  }

  return (
    <div className="column grow center project-selector-container">
      <h2>Connect to a Project</h2>
      <blockquote className="project-selector-intro">
        To use this app, you need to connect it to an Audiotool project. An
        empty project is recommended for the best experience.
      </blockquote>

      <div className="column grow full-width">
        <div className="column full-width small-gap">
          <button
            className={`primary ${loading ? "loading" : ""}`}
            onClick={() => {
              void createNewProject()
            }}
            disabled={loading || !client}
          >
            <span className="material-symbols-outlined">
              {loading ? "progress_activity" : "add"}
            </span>

            {loading ? "Connecting" : "New Project"}
          </button>
          {showProjectList === false && (
            <button
              className={`secondary`}
              onClick={() => {
                setShowProjectList(true)
              }}
              disabled={loading || !client}
            >
              <span className="material-symbols-outlined">arrow_forward</span>{" "}
              Existing project
            </button>
          )}
        </div>

        {client && showProjectList && !loading && (
          <ProjectList
            client={client}
            onSelected={handleProjectSelected}
            disabled={loading}
          />
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  )
}
