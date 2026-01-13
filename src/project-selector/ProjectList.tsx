import type { AudiotoolClient } from "@audiotool/nexus"
import { useEffect, useState } from "react"
import { ProjectListItem } from "./ProjectListItem"

export type ProjectListItemType = {
  id: string
  displayName: string
  description: string
}

interface ProjectListProps {
  client: AudiotoolClient | undefined
  onSelected: (projectId: string) => void
  disabled?: boolean
}

export const ProjectList = ({
  client,
  onSelected,
  disabled = false,
}: ProjectListProps) => {
  const [projects, setProjects] = useState<ProjectListItemType[]>([])
  const [nextPageToken, setNextPageToken] = useState<string>("")

  useEffect(() => {
    fetchProjects()
  }, [])

  // Fetch projects when client is ready
  const fetchProjects = async (pageToken: string = "") => {
    if (!client) return

    try {
      const request = {
        pageSize: 10,
        pageToken: pageToken,
        orderBy: "project.update_time desc",
      }

      const response = await client.api.projectService.listProjects(request)

      // Handle potential error response
      if (response instanceof Error) {
        throw response
      }

      const projectList: ProjectListItemType[] = (response.projects || []).map(
        (project: {
          name: string
          displayName?: string
          description?: string
        }) => {
          // Extract project ID from name (format: "projects/{project_id}")
          const projectId = project.name.replace("projects/", "")
          return {
            id: projectId,
            displayName: project.displayName || "Untitled Project",
            description: project.description || "",
          }
        },
      )

      const allProjects = [...projects, ...projectList]
      setProjects(allProjects)
      setNextPageToken(response.nextPageToken || "")
    } catch (e) {
      console.error("Failed to fetch projects:", e)
      // Don't set error state here as it might interfere with connection errors
    }
  }

  const loadMore = () => {
    if (nextPageToken) {
      void fetchProjects(nextPageToken)
    }
  }

  return (
    <div className="column grow  full-width">
      {projects.length > 0 ? (
        <>
          <p>Existing Projects</p>
          <div className="column grow scrollable full-width no-gap">
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onClick={() => onSelected(project.id)}
                disabled={disabled}
              />
            ))}
            <br></br>
            <button
              className="hug"
              onClick={loadMore}
              disabled={!nextPageToken || disabled}
            >
              Load More
            </button>
          </div>
        </>
      ) : (
        <p className="secondary-text">No projects found</p>
      )}
    </div>
  )
}
