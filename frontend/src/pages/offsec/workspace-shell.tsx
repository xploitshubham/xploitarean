import type { ReactNode } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaces } from '@/features/workspaces/workspace-context';

const WorkspaceShell = ({ children }: { children?: ReactNode }) => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { workspaces } = useWorkspaces();

    const workspace = workspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
        return <Navigate replace to="/offsec" />;
    }

    return (
        <div className="flex flex-1 flex-col">
            {children ?? (
                <Card>
                    <CardHeader>
                        <CardTitle>Workspace</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Outlet />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WorkspaceShell;

