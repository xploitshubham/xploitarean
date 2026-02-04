import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type WorkspaceSection =
    | 'dashboard'
    | 'recon'
    | 'ai-attack-flow'
    | 'poc-maker'
    | 'payload-generator'
    | 'zero-day-finder'
    | 'osint-hunter'
    | 'report-generator'
    | 'toolbox';

export type Workspace = {
    id: string;
    name: string;
    createdAt: string;
    description?: string;
};

type WorkspaceContextValue = {
    workspaces: Workspace[];
    selectedWorkspaceId: string | null;
    selectWorkspace: (id: string | null) => void;
    createWorkspace: (name: string, description?: string) => Workspace;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = 'xiq.offsec.workspaces';

const loadInitialWorkspaces = (): Workspace[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [
                {
                    id: 'default',
                    name: 'XIQ Playground',
                    createdAt: new Date().toISOString(),
                    description: 'Default workspace',
                },
            ];
        }
        const parsed = JSON.parse(raw) as Workspace[];
        if (!Array.isArray(parsed)) return [];
        
        // Migration: Update "Red Team Playground" to "XIQ Playground" and remove old descriptions
        const migrated = parsed.map((ws) => {
            if (ws.name === 'Red Team Playground' || ws.name === 'Default Workspace') {
                return {
                    ...ws,
                    name: 'XIQ Playground',
                    description: ws.description?.includes('offensive security') ? undefined : ws.description,
                };
            }
            // Also remove old descriptions from any workspace
            if (ws.description?.includes('offensive operations') || ws.description?.includes('automation aur reporting')) {
                return {
                    ...ws,
                    description: undefined,
                };
            }
            return ws;
        });
        
        // Save migrated workspaces back to localStorage
        if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
        
        return migrated;
    } catch {
        return [];
    }
};

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => loadInitialWorkspaces());
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(() =>
        workspaces[0]?.id ?? null,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
    }, [workspaces]);

    const selectWorkspace = useCallback((id: string | null) => {
        setSelectedWorkspaceId(id);
    }, []);

    const createWorkspace = useCallback((name: string, description?: string): Workspace => {
        const ws: Workspace = {
            id: `${Date.now()}`,
            name: name.trim() || 'Untitled Workspace',
            createdAt: new Date().toISOString(),
            description,
        };
        setWorkspaces((prev) => [...prev, ws]);
        setSelectedWorkspaceId(ws.id);
        return ws;
    }, []);

    const value = useMemo(
        () => ({
            workspaces,
            selectedWorkspaceId,
            selectWorkspace,
            createWorkspace,
        }),
        [workspaces, selectedWorkspaceId, selectWorkspace, createWorkspace],
    );

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaces = () => {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) {
        // Safe fallback so that accidental usage outside provider
        // does not crash the whole app – returns inert helpers.
        return {
            workspaces: [] as Workspace[],
            selectedWorkspaceId: null as string | null,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            selectWorkspace: () => {},
            createWorkspace: (name: string, description?: string): Workspace => ({
                id: 'fallback',
                name: name.trim() || 'Untitled Workspace',
                createdAt: new Date().toISOString(),
                description,
            }),
        } satisfies WorkspaceContextValue;
    }
    return ctx;
};


