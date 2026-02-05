import { Activity, EllipsisVertical, FolderKanban, Plus, ShieldAlert, Users } from 'lucide-react';
import { useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Logo from '@/components/icons/logo';
import { useWorkspaces } from '@/features/workspaces/workspace-context';

const OffsecDashboard = () => {
    const navigate = useNavigate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { workspaces, createWorkspace, selectWorkspace } = useWorkspaces();

    const handleCreateWorkspace = () => {
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const ws = createWorkspace(trimmed, description.trim() || undefined);
        selectWorkspace(ws.id);
        navigate(`/dashboard/workspaces/${ws.id}/dashboard`);
        setIsCreateOpen(false);
        setName('');
        setDescription('');
    };

    const handleOpenWorkspace = (id: string) => {
        selectWorkspace(id);
        navigate(`/dashboard/workspaces/${id}/dashboard`);
    };

    return (
        <div className="flex flex-1 flex-col gap-8 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 p-4 lg:p-8">
            {/* Hero / overview */}
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(8,47,73,0.6)] lg:flex-row lg:items-center lg:justify-between lg:p-7">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-2 ring-amber-400/60">
                        <Logo className="h-10 w-auto drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">XIQ Workspaces</h1>
                        <p className="text-muted-foreground text-sm lg:text-base">
                            Har workspace ek dedicated offensive lab hai &mdash; recon, AI attack flows, PoCs aur reports
                            ek hi jagah.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2">
                            <span className="inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                                    Active workspaces
                                </span>
                                <span className="font-semibold text-emerald-300">{workspaces.length}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2">
                            <Activity className="size-4 text-sky-300" />
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                                    Status
                                </span>
                                <span className="font-semibold text-sky-100">Ready to launch</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        className="gap-2 whitespace-nowrap"
                        onClick={handleCreateWorkspace}
                        size="lg"
                    >
                        <Plus className="size-4" />
                        New workspace
                    </Button>
                </div>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1.5">
                    <Users className="size-3.5 text-sky-300" />
                    <span className="font-medium">Multi‑workspace XIQ console</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1.5">
                    <ShieldAlert className="size-3.5 text-emerald-300" />
                    <span className="font-medium">Isolated targets, flows &amp; reports per workspace</span>
                </div>
            </div>

            {/* Workspace grid */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {workspaces.map((ws) => (
                    <Card
                        className="group relative cursor-pointer overflow-hidden border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/80 transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                        key={ws.id}
                        onClick={() => handleOpenWorkspace(ws.id)}
                    >
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                            <div className="absolute -right-24 -top-24 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
                        </div>

                        <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/50">
                                    <span className="text-sm font-semibold">
                                        {ws.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-semibold leading-tight">
                                        {ws.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-400/40">
                                            <span className="size-1.5 rounded-full bg-emerald-400" />
                                            Active
                                        </span>
                                        <span>
                                            Created&nbsp;
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
                        <CardContent className="relative z-10 space-y-3">
                            <CardDescription className="line-clamp-3 text-xs text-slate-200">
                                {ws.description ||
                                    'Dedicated workspace for targets, recon automation, AI attack flows, PoCs and reports.'}
                            </CardDescription>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1">
                                    <FolderKanban className="size-3" />
                                    <span className="font-medium">Workspace overview</span>
                                </div>
                                <span className="font-medium text-amber-200 group-hover:text-amber-300">
                                    Open dashboard &rarr;
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {workspaces.length === 0 && (
                    <Card className="border-dashed border-slate-800/80 bg-slate-950/80">
                        <CardHeader>
                            <CardTitle className="text-sm">No workspaces yet</CardTitle>
                            <CardDescription className="text-xs">
                                Pehla workspace banao &mdash; XIQ tumhare recon, AI attack flows aur reporting ko ek
                                jagah organize karega.
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

            {/* Create workspace dialog */}
            <Dialog
                onOpenChange={(open) => setIsCreateOpen(open)}
                open={isCreateOpen}
            >
                <DialogContent className="max-w-xl border-slate-800 bg-slate-950/95 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-left text-lg font-semibold">
                            Create New Workspace
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Workspaces help you organize your targets, findings and reports for each engagement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input
                                id="workspace-name"
                                placeholder="Tesla, Internal PT, Bug Bounty, Red Team Sprint..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workspace-description">
                                Description <span className="text-xs text-slate-500">(optional)</span>
                            </Label>
                            <Textarea
                                id="workspace-description"
                                placeholder="Short context about this workspace &mdash; scope, program URL or internal notes."
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!name.trim()}
                            onClick={handleCreateSubmit}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OffsecDashboard;

