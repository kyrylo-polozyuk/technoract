import type { ProjectListItemType } from "./ProjectList"
import "./ProjectListItem.css"

interface ProjectListItemProps {
  project: ProjectListItemType
  onClick: () => void
  disabled?: boolean
}

export const ProjectListItem = ({
  project,
  onClick,
  disabled = false,
}: ProjectListItemProps) => {
  return (
    <button onClick={onClick} disabled={disabled} className="project-list-item">
      <div>{project.displayName}</div>
    </button>
  )
}
