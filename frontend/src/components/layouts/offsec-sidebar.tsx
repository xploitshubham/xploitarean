import {
    Compass,
    FileText,
    FlaskConical,
    FolderKanban,
    Map,
    Radar,
    ShieldAlert,
    Swords,
    TerminalSquare,
    Plus,
    ChevronRight,
} from 'lucide-react';
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/icons/logo';
import { useWorkspaces } from '@/features/workspaces/workspace-context';
import { Separator } from '@/components/ui/separator';

const OffsecSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { workspaces, selectedWorkspaceId, selectWorkspace, createWorkspace } = useWorkspaces();

    // Always call hooks unconditionally
    const dashboardMatch1 = useMatch('/dashboard');
    const dashboardMatch2 = useMatch('/dashboard/');
    const workspaceMatch = useMatch('/dashboard/workspaces/:workspaceId/*');
    
    const isDashboardActive = !!dashboardMatch1 || !!dashboardMatch2;
    const isWorkspaceRoute = !!workspaceMatch;

    const handleCreateWorkspace = () => {
        const name = window.prompt('Workspace name:');
        if (!name) return;
        const ws = createWorkspace(name);
        navigate(`/dashboard/workspaces/${ws.id}/dashboard`);
    };

    const handleWorkspaceClick = (id: string) => {
        selectWorkspace(id);
        navigate(`/dashboard/workspaces/${id}/dashboard`);
    };

    const currentWorkspace =
        workspaces.find((w) => w.id === selectedWorkspaceId) ?? workspaces[0] ?? null;

    const workspaceBasePath = currentWorkspace
        ? `/dashboard/workspaces/${currentWorkspace.id}`
        : '/dashboard';

    const workspaceSectionItems = [
        { icon: Compass, label: 'Dashboard', slug: 'dashboard' },
        { icon: Radar, label: 'Recon Engine', slug: 'recon' },
        { icon: Swords, label: 'AI Attack Flow', slug: 'ai-attack-flow' },
        { icon: FlaskConical, label: 'PoC Maker', slug: 'poc-maker' },
        { icon: TerminalSquare, label: 'Payload Generator', slug: 'payload-generator' },
        { icon: ShieldAlert, label: 'Zero-Day Finder', slug: 'zero-day-finder' },
        { icon: Map, label: 'OSINT Hunter', slug: 'osint-hunter' },
        { icon: FileText, label: 'Report Generator', slug: 'report-generator' },
        { icon: FolderKanban, label: 'Toolbox', slug: 'toolbox' },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r border-border/50">
            <SidebarHeader className="border-b border-border/50 bg-gradient-to-br from-background via-background to-muted/20 p-4">
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center gap-3">
                        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                            <Logo className="hover:animate-logo-spin size-5 text-primary" />
                        </div>
                        <div className="grid flex-1 text-left leading-tight">
                            <span className="truncate font-bold text-base tracking-tight">XIQ</span>
                            <span className="text-muted-foreground truncate text-xs font-medium">Offensive Security Platform</span>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-2">
                {!isWorkspaceRoute && (
                    <>
                        <SidebarGroup className="px-2">
                            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                                Navigation
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={!!isDashboardActive}
                                            className="group relative rounded-lg transition-all hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                                        >
                                            <Link to="/dashboard" className="flex items-center gap-3">
                                                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 group-data-[active=true]:bg-primary/20">
                                                    <Radar className="size-4" />
                                                </div>
                                                <span className="font-medium">Dashboard</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <Separator className="mx-2" />

                        <SidebarGroup className="px-2">
                            <SidebarGroupLabel className="flex items-center justify-between gap-2 px-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Workspaces
                                </span>
                                <Button
                                    className="h-6 w-6 p-0"
                                    onClick={handleCreateWorkspace}
                                    size="sm"
                                    variant="ghost"
                                    title="Create new workspace"
                                >
                                    <Plus className="size-3.5" />
                                </Button>
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {workspaces.map((ws) => (
                                        <SidebarMenuItem key={ws.id}>
                                            <SidebarMenuButton
                                                isActive={currentWorkspace?.id === ws.id}
                                                onClick={() => handleWorkspaceClick(ws.id)}
                                                className="group relative rounded-lg transition-all hover:bg-muted/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                                            >
                                                <div className="flex size-8 items-center justify-center rounded-md bg-muted group-data-[active=true]:bg-primary/20">
                                                    <FolderKanban className="size-4" />
                                                </div>
                                                <span className="truncate font-medium">{ws.name}</span>
                                                {currentWorkspace?.id === ws.id && (
                                                    <ChevronRight className="ml-auto size-4 opacity-50" />
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                    {workspaces.length === 0 && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={handleCreateWorkspace}
                                            >
                                                <Plus className="size-4" />
                                                <span className="text-xs font-medium">
                                                    Create workspace
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {isWorkspaceRoute && currentWorkspace && (
                    <>
                        <SidebarGroup className="px-2">
                            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex size-6 items-center justify-center rounded bg-primary/20">
                                        <FolderKanban className="size-3.5 text-primary" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Active Workspace
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {currentWorkspace.name}
                                </p>
                            </div>
                        </SidebarGroup>

                        <Separator className="mx-2" />

                        <SidebarGroup className="px-2">
                            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                                Workspace Tools
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-1">
                                    {workspaceSectionItems.map((item) => {
                                        const targetPath = `${workspaceBasePath}/${item.slug}`;
                                        const isActive =
                                            location.pathname === targetPath ||
                                            location.pathname.startsWith(`${targetPath}/`);

                                        return (
                                            <SidebarMenuItem key={item.slug}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    className="group relative rounded-lg transition-all hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm data-[active=true]:font-semibold"
                                                >
                                                    <Link to={targetPath} className="flex items-center gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-md bg-muted/50 group-data-[active=true]:bg-primary/20 transition-colors">
                                                            <item.icon className="size-4" />
                                                        </div>
                                                        <span className="font-medium">{item.label}</span>
                                                        {isActive && (
                                                            <div className="ml-auto size-1.5 rounded-full bg-primary" />
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-border/50 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="rounded-lg transition-all hover:bg-muted/50"
                        >
                            <Link to="/flows" className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-md bg-muted/50">
                                    <TerminalSquare className="size-4" />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="block font-medium text-sm">Advanced Flows</span>
                                    <span className="text-xs text-muted-foreground">Legacy interface</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
};

export default OffsecSidebar;

