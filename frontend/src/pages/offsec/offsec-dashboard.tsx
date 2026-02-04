import {
    EllipsisVertical,
    Plus,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaces } from '@/features/workspaces/workspace-context';

const OffsecDashboard = () => {
    const navigate = useNavigate();
    const { workspaces, createWorkspace, selectWorkspace } = useWorkspaces();

    const handleCreateWorkspace = () => {
        const name = window.prompt('Workspace name (e.g. Tesla Bug Bounty, Internal PT):');
        if (!name) return;
        const ws = createWorkspace(name);
        selectWorkspace(ws.id);
        navigate(`/dashboard/workspaces/${ws.id}/dashboard`);
    };

    const handleOpenWorkspace = (id: string) => {
        selectWorkspace(id);
        navigate(`/dashboard/workspaces/${id}/dashboard`);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Your Workspaces</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Offensive labs, bug bounty programs aur red‑team campaigns ko yahan manage karo.
                    </p>
                </div>
                <Button
                    className="gap-2"
                    onClick={handleCreateWorkspace}
                >
                    <Plus className="size-4" />
                    Create Workspace
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 px-3 py-1 text-emerald-300">
                    <span className="inline-flex size-2 rounded-full bg-emerald-400" />
                    Active: {workspaces.length}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-3 py-1">
                    <Users className="size-3.5" />
                    Multi‑tenant offensive console
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-3 py-1">
                    <ShieldAlert className="size-3.5" />
                    Each workspace isolates targets, flows & reports
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {workspaces.map((ws) => (
                    <Card
                        className="group relative cursor-pointer border-slate-800/70 bg-slate-900/60 transition hover:border-emerald-400/60 hover:bg-slate-900"
                        key={ws.id}
                        onClick={() => handleOpenWorkspace(ws.id)}
                    >
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/40">
                                    <span className="text-xs font-semibold">
                                        {ws.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-semibold leading-tight">
                                        {ws.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-400/40">
                                            Active
                                        </span>
                                        <span className="text-slate-500">
                                            {new Date(ws.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <EllipsisVertical className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                >
                                    <DropdownMenuItem onClick={() => handleOpenWorkspace(ws.id)}>
                                        Open
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled
                                        className="cursor-not-allowed opacity-60"
                                    >
                                        Import (soon)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled
                                        className="cursor-not-allowed opacity-60"
                                    >
                                        Export (soon)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <CardDescription className="line-clamp-3 text-xs text-slate-300">
                                {ws.description ||
                                    'Workspace for recon, exploitation and reporting on a specific target or engagement.'}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}

                {workspaces.length === 0 && (
                    <Card className="border-dashed border-slate-800/80 bg-slate-900/40">
                        <CardHeader>
                            <CardTitle className="text-sm">No workspaces yet</CardTitle>
                            <CardDescription className="text-xs">
                                Create your first offensive lab or campaign to start running recon and
                                AI‑driven attack flows.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="gap-2"
                                onClick={handleCreateWorkspace}
                                size="sm"
                                variant="outline"
                            >
                                <Plus className="size-4" />
                                Create Workspace
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default OffsecDashboard;

