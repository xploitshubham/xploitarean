import { Activity, Clock, ShieldAlert, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Logo from '@/components/icons/logo';
import { useWorkspaces } from '@/features/workspaces/workspace-context';

const XiqMainDashboard = () => {
    const navigate = useNavigate();
    const { workspaces } = useWorkspaces();

    const handleGoToWorkspaces = () => {
        navigate('/dashboard/workspaces');
    };

    const totalWorkspaces = workspaces.length;

    return (
        <div className="flex flex-1 flex-col gap-8 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 p-4 lg:p-8">
            {/* Hero */}
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-[0_0_40px_rgba(8,47,73,0.6)] lg:flex-row lg:items-center lg:justify-between lg:p-8">
                <div className="flex items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-2 ring-amber-400/60">
                        <Logo className="h-11 w-auto drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">XIQ Command Center</h1>
                        <p className="text-muted-foreground text-sm lg:text-base">
                            Global view of your offensive operations &mdash; workspaces, recon automation, AI attack flows
                            and reporting in one place.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        className="gap-2"
                        onClick={handleGoToWorkspaces}
                        size="lg"
                    >
                        <Target className="size-4" />
                        Open Workspaces
                    </Button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-slate-800/80 bg-slate-950/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
                        <Target className="size-4 text-amber-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWorkspaces}</div>
                        <p className="text-muted-foreground text-xs">
                            Active offensive labs and bug bounty programs you are tracking.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-800/80 bg-slate-950/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recon &amp; AI Attack Flows</CardTitle>
                        <Zap className="size-4 text-sky-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Live</div>
                        <p className="text-muted-foreground text-xs">
                            Drill into any workspace to see running scans and AI‑driven attack paths.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-800/80 bg-slate-950/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security Posture</CardTitle>
                        <ShieldAlert className="size-4 text-emerald-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Centralized</div>
                        <p className="text-muted-foreground text-xs">
                            Reports, PoCs and payloads are organized by workspace for clean separation.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick launch + recent workspaces */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Quick actions */}
                <Card className="border-slate-800/80 bg-slate-950/80 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Quick Launch</CardTitle>
                        <CardDescription className="text-xs">
                            Start common XIQ flows in a single click.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Button
                            className="justify-start gap-3"
                            onClick={handleGoToWorkspaces}
                            variant="outline"
                            size="sm"
                        >
                            <Target className="size-4 text-amber-300" />
                            <span className="text-sm font-medium">Open workspace directory</span>
                        </Button>
                        <Button
                            className="justify-start gap-3"
                            onClick={() => navigate('/dashboard/workspaces/default/recon')}
                            variant="outline"
                            size="sm"
                        >
                            <Zap className="size-4 text-sky-300" />
                            <span className="text-sm font-medium">Run new Recon Engine scan</span>
                        </Button>
                        <Button
                            className="justify-start gap-3"
                            onClick={() => navigate('/dashboard/workspaces/default/ai-attack-flow')}
                            variant="outline"
                            size="sm"
                        >
                            <Activity className="size-4 text-emerald-300" />
                            <span className="text-sm font-medium">View AI Attack Flows</span>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent workspaces */}
                <Card className="border-slate-800/80 bg-slate-950/80 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-medium">Recent Workspaces</CardTitle>
                            <CardDescription className="text-xs">
                                Last workspaces you touched inside XIQ.
                            </CardDescription>
                        </div>
                        <Clock className="size-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        {workspaces.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                No workspaces yet. Create your first workspace from the Workspaces view.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2 text-sm">
                                {workspaces.slice(0, 4).map((ws) => (
                                    <button
                                        key={ws.id}
                                        className="flex w-full items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-left transition hover:border-amber-400/60 hover:bg-slate-900"
                                        onClick={() => navigate(`/dashboard/workspaces/${ws.id}/dashboard`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-amber-200">
                                                <span className="text-xs font-semibold">
                                                    {ws.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ws.name}</span>
                                                <span className="text-muted-foreground text-[11px]">
                                                    Created {new Date(ws.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default XiqMainDashboard;

