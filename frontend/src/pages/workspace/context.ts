import { useOutletContext } from "react-router";
import type { WorkspaceDetail } from "../../types";

export type WorkspaceContext = { workspace: WorkspaceDetail };

// Child tabs read the loaded workspace from the layout instead of fetching it again.
export const useWorkspaceContext = () => useOutletContext<WorkspaceContext>();
