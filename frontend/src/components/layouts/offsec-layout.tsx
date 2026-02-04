import { Outlet } from 'react-router-dom';

import OffsecSidebar from '@/components/layouts/offsec-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { WorkspaceProvider } from '@/features/workspaces/workspace-context';

const OffsecLayout = () => {
    return (
        <WorkspaceProvider>
            <SidebarProvider>
                <OffsecSidebar />
                <SidebarInset>
                    <Outlet />
                </SidebarInset>
            </SidebarProvider>
        </WorkspaceProvider>
    );
};

export default OffsecLayout;

