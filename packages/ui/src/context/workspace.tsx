import { createContext, useContext } from "solid-js"

const WorkspaceContext = createContext<string>()

export const WorkspaceProvider = WorkspaceContext.Provider
export const useWorkspace = () => useContext(WorkspaceContext)
