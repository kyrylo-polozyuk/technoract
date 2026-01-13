import type {
  EntityTypeKey,
  NexusEntity,
  SafeTransactionBuilder,
  SyncedDocument,
} from "@audiotool/nexus/document"
import { TechnoStateSchema } from "./schemas"
import { type SerializedEntity, type TechnoState } from "./types"

/**
 * Checks if a value is a NexusEntity by checking for entityType and id properties
 */
const isNexusEntity = (value: unknown): value is NexusEntity => {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value !== "object") {
    return false
  }
  const entity = value as Record<string, unknown>
  return typeof entity.entityType === "string" && typeof entity.id === "string"
}

/**
 * Recursively serializes a value, converting NexusEntity objects to { type, id }
 */
const serializeValue = (value: unknown): unknown => {
  if (isNexusEntity(value)) {
    return {
      entityType: value.entityType,
      id: value.id,
    }
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (value != null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val)
    }
    return result
  }

  return value
}

/**
 * Extracts project ID from projectUrl
 * Handles various URL formats:
 * - Query parameter: ?project=PROJECT_ID
 * - Path segments: /studio/PROJECT_ID or /project/PROJECT_ID
 * - Already just an ID
 */
export const extractProjectId = (projectUrl: string): string => {
  const trimmed = projectUrl.trim()

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

/**
 * Checks if a value is a serialized entity (has type and id properties)
 */
const isSerializedEntity = (value: unknown): value is SerializedEntity => {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value !== "object") {
    return false
  }
  const obj = value as Record<string, unknown>
  return typeof obj.entityType === "string" && typeof obj.id === "string"
}

/**
 * Recursively deserializes a value, converting { type, id } objects to NexusEntity
 */
const deserializeValue = (
  value: unknown,
  t: SafeTransactionBuilder,
): unknown => {
  if (isSerializedEntity(value)) {
    const entity = t.entities
      .ofTypes(value.entityType as EntityTypeKey)
      .getEntity(value.id)
    return entity
  }

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(item, t))
  }

  if (value != null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      result[key] = deserializeValue(value[key as keyof typeof value], t)
    }
    return result
  }

  return value
}

/**
 * Saves TechnoState to localStorage using project ID as key
 */
export const saveTechnoStateToLocalStorage = (
  technoState: TechnoState,
  projectUrl: string,
): void => {
  try {
    const projectId = extractProjectId(projectUrl)
    const serialized = serializeValue(technoState) as Record<string, unknown>
    const jsonString = JSON.stringify(serialized)
    localStorage.setItem(projectId, jsonString)
  } catch (error) {
    console.error("Failed to save TechnoState to localStorage:", error)
  }
}

export const clearTechnoStateFromLocalStorage = (projectUrl: string): void => {
  try {
    const projectId = extractProjectId(projectUrl)
    localStorage.removeItem(projectId)
  } catch (error) {
    console.error("Failed to clear TechnoState from localStorage:", error)
  }
}

/**
 * Loads TechnoState from localStorage and deserializes it using nexus queries
 */
export const loadTechnoStateFromLocalStorage = async (
  nexus: SyncedDocument,
  projectUrl: string,
): Promise<TechnoState | undefined> => {
  const projectId = extractProjectId(projectUrl)
  const jsonString = localStorage.getItem(projectId)
  if (!jsonString) {
    return
  }

  const json = JSON.parse(jsonString) as Record<string, unknown>

  const deserializedTechnoState = await nexus.modify((t) => {
    return deserializeValue(json, t)
  })

  try {
    const technoState = TechnoStateSchema.parse(deserializedTechnoState)
    return technoState
  } catch (error) {
    console.error(error)
    return undefined
  }
}
