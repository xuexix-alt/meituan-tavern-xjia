import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { loadWorkspace, saveWorkspace, type WorkspaceState } from '../storage/localStore';

export function usePersistentState(): [WorkspaceState, Dispatch<SetStateAction<WorkspaceState>>] {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  return [workspace, setWorkspace];
}
