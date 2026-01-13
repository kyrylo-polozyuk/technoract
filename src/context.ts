import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { createContext } from "react"

export type AudiotoolContextType = {
  client: AudiotoolClient | undefined
  nexus: SyncedDocument | undefined
}

export const AudiotoolContext = createContext<AudiotoolContextType>({
  client: undefined,
  nexus: undefined,
})
