import {
    Compass,
    FileText,
    FlaskConical,
    Loader2,
    Map,
    Plus,
    Radar,
    ShieldAlert,
    TerminalSquare,
    Workflow,
    GripVertical,
    Copy,
    Check,
    Hash,
    Key,
    Link,
    Code,
    Clock,
    Shield,
    Zap,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    FolderKanban,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TextareaAutosize } from '@/components/ui/textarea-autosize';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlowsProvider, useFlows } from '@/providers/flows-provider';
import { useProviders } from '@/providers/providers-provider';
import { getProviderDisplayName } from '@/models/provider';
import { ProviderType } from '@/graphql/types';
import Flow from '@/pages/flows/flow';
import { FlowProvider } from '@/providers/flow-provider';
import { FlowStatusIcon } from '@/components/icons/flow-status-icon';
import { formatName } from '@/lib/utils/format';
import FlowTasks from '@/features/flows/tasks/flow-tasks';
import { useWorkspaces } from '@/features/workspaces/workspace-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Placeholder = ({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Radar;
    title: string;
    description: string;
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-2">
            <Icon className="text-primary size-5" />
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{description}</p>
            <p className="text-muted-foreground">
                Abhi yeh ek skeleton view hai – yahan par hum future me tools, tables,
                timelines, aur automation hooks wire kar sakte hain.
            </p>
        </CardContent>
    </Card>
);

// Workspace-Flow mapping storage
const WORKSPACE_FLOWS_STORAGE_KEY = 'xiq.workspace.flows';

const getWorkspaceFlowsMap = (): Record<string, string[]> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(WORKSPACE_FLOWS_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
        return {};
    }
};

const saveWorkspaceFlowsMap = (map: Record<string, string[]>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_FLOWS_STORAGE_KEY, JSON.stringify(map));
};

const addFlowToWorkspace = (workspaceId: string, flowId: string) => {
    const map = getWorkspaceFlowsMap();
    if (!map[workspaceId]) {
        map[workspaceId] = [];
    }
    if (!map[workspaceId].includes(flowId)) {
        map[workspaceId].push(flowId);
        saveWorkspaceFlowsMap(map);
    }
};

// Migration: Associate unassigned flows to default workspace
const migrateUnassignedFlows = (workspaceId: string | undefined, allFlows: any[]) => {
    if (!workspaceId || typeof window === 'undefined') return;
    
    const map = getWorkspaceFlowsMap();
    const defaultWorkspaceId = 'default';
    
    // Find all flow IDs that are not assigned to any workspace
    const allAssignedFlowIds = new Set<string>();
    Object.values(map).forEach((flowIds) => {
        flowIds.forEach((id) => allAssignedFlowIds.add(String(id)));
    });
    
    // Get unassigned flows
    const unassignedFlows = allFlows.filter((f) => {
        const flowId = String(f.id || '');
        return flowId && !allAssignedFlowIds.has(flowId);
    });
    
    // If there are unassigned flows, assign them to default workspace
    if (unassignedFlows.length > 0) {
        if (!map[defaultWorkspaceId]) {
            map[defaultWorkspaceId] = [];
        }
        const defaultFlows = map[defaultWorkspaceId];
        if (defaultFlows) {
            unassignedFlows.forEach((f) => {
                const flowId = String(f.id || '');
                if (flowId && !defaultFlows.includes(flowId)) {
                    defaultFlows.push(flowId);
                }
            });
            saveWorkspaceFlowsMap(map);
        }
    }
};

const getWorkspaceFlows = (workspaceId: string | undefined, allFlows: any[]) => {
    if (!workspaceId) return [];
    
    // Migrate unassigned flows to default workspace
    migrateUnassignedFlows(workspaceId, allFlows);
    
    const map = getWorkspaceFlowsMap();
    const flowIds = map[workspaceId] || [];
    return allFlows.filter((f) => flowIds.includes(String(f.id || '')));
};

const WorkspaceDashboardInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading } = useFlows();
    const { workspaces, selectWorkspace, createWorkspace } = useWorkspaces();

    // Get current workspace
    const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    const handleWorkspaceSwitch = (targetWorkspaceId: string) => {
        if (targetWorkspaceId === workspaceId) return; // Already on this workspace
        selectWorkspace(targetWorkspaceId);
        navigate(`/dashboard/workspaces/${targetWorkspaceId}/dashboard`, { replace: true });
    };

    const handleCreateNewWorkspace = () => {
        const name = window.prompt('Workspace name:');
        if (!name) return;
        const ws = createWorkspace(name);
        navigate(`/dashboard/workspaces/${ws.id}/dashboard`);
    };

    // Calculate stats
    const stats = useMemo(() => {
        const total = flows.length;
        const active = flows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = flows.filter((f) => f.status === 'finished').length;
        const failed = flows.filter((f) => f.status === 'failed').length;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Sort by ID (newer flows typically have higher IDs) and take most recent 10
        const recentFlows = [...flows]
            .sort((a, b) => {
                const aId = String(a.id || '');
                const bId = String(b.id || '');
                return bId.localeCompare(aId);
            })
            .slice(0, 10);

        return { total, active, completed, failed, recentFlows, successRate };
    }, [flows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Corporate Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity group">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        {currentWorkspace?.name || 'Workspace Dashboard'}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {currentWorkspace?.description || 'Security assessment and reconnaissance overview'}
                                    </p>
                                </div>
                                <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuLabel>Select Workspace</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="max-h-[300px]">
                                {workspaces.map((ws) => (
                                    <DropdownMenuItem
                                        key={ws.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleWorkspaceSwitch(ws.id);
                                        }}
                                        className={ws.id === workspaceId ? 'bg-primary/10 font-semibold' : ''}
                                    >
                                        <FolderKanban className="mr-2 size-4" />
                                        <span className="flex-1">{ws.name}</span>
                                        {ws.id === workspaceId && (
                                            <Check className="ml-2 size-4 text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </ScrollArea>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleCreateNewWorkspace}>
                                <Plus className="mr-2 size-4" />
                                Create New Workspace
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => workspaceId && navigate(`/dashboard/workspaces/${workspaceId}/recon`)}
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="size-4" />
                        New Target
                    </Button>
                </div>
            </div>

            {/* KPI Cards - Corporate Style */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Targets</CardTitle>
                        <div className="rounded-md bg-blue-500/10 p-2">
                            <Radar className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Reconnaissance flows</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Scans</CardTitle>
                        <div className="rounded-md bg-amber-500/10 p-2">
                            <Activity className="size-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently running</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        <div className="rounded-md bg-emerald-500/10 p-2">
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                        <div className="rounded-md bg-red-500/10 p-2">
                            <XCircle className="size-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Success Rate</span>
                                <span className="font-semibold">{stats.successRate}%</span>
                            </div>
                            <Progress value={stats.successRate} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <TrendingUp className="size-3 text-emerald-500" />
                                    <span>Completion</span>
                                </div>
                                <div className="text-lg font-semibold">{stats.completed}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <TrendingDown className="size-3 text-red-500" />
                                    <span>Failures</span>
                                </div>
                                <div className="text-lg font-semibold">{stats.failed}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            className="w-full justify-start gap-2"
                            onClick={() => workspaceId && navigate(`/dashboard/workspaces/${workspaceId}/recon`)}
                            variant="outline"
                        >
                            <Radar className="size-4" />
                            <span>Add New Target</span>
                        </Button>
                        <Button
                            className="w-full justify-start gap-2"
                            onClick={() => workspaceId && navigate(`/dashboard/workspaces/${workspaceId}/ai-attack-flow`)}
                            variant="outline"
                        >
                            <Workflow className="size-4" />
                            <span>View AI Attack Flow</span>
                        </Button>
                        <Button
                            className="w-full justify-start gap-2"
                            onClick={() => workspaceId && navigate(`/dashboard/workspaces/${workspaceId}/report-generator`)}
                            variant="outline"
                        >
                            <FileText className="size-4" />
                            <span>Generate Report</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Table - Corporate Style */}
            <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => workspaceId && navigate(`/dashboard/workspaces/${workspaceId}/recon`)}
                            className="text-xs"
                        >
                            View All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading activity...</p>
                        </div>
                    ) : stats.recentFlows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Compass className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No activity yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Start by adding a target in Recon Engine
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Status</TableHead>
                                    <TableHead>Target / Flow</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentFlows.map((flow) => (
                                    <TableRow
                                        key={flow.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/flows/${flow.id}`)}
                                    >
                                        <TableCell>
                                            <FlowStatusIcon
                                                status={flow.status}
                                                tooltip={formatName(flow.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {flow.title || `Flow ${String(flow.id || '').slice(0, 8)}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs text-muted-foreground">
                                                {String(flow.id || '').slice(0, 8)}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                className="text-xs capitalize"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const WorkspaceDashboardSection = () => (
    <FlowsProvider>
        <WorkspaceDashboardInner />
    </FlowsProvider>
);

const RECON_NOTIFY_STORAGE_KEY = 'xiq.recon.notifyOnComplete';

const loadNotifyMap = (): Record<string, boolean> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(RECON_NOTIFY_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
        return {};
    }
};

const saveNotifyMap = (map: Record<string, boolean>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECON_NOTIFY_STORAGE_KEY, JSON.stringify(map));
};

const ReconCreateForm = () => {
    const [open, setOpen] = useState(false);
    const [domain, setDomain] = useState('');
    const [includeSubdomains, setIncludeSubdomains] = useState(true);
    const [scopeType, setScopeType] = useState<'web' | 'api' | 'mobile'>('web');
    const [autoScan, setAutoScan] = useState(true);
    const [notifyOnComplete, setNotifyOnComplete] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleSubmit = async () => {
        const trimmed = domain.trim();
        if (!trimmed) {
            toast.error('Please enter a target domain');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const providerName =
                selectedProvider?.name || providers[0]?.name || '';

            const message = [
                'You are an offensive security recon agent.',
                `Primary target: ${trimmed}.`,
                `Scope type: ${scopeType.toUpperCase()} target.`,
                includeSubdomains
                    ? 'Include subdomains and related assets in scope.'
                    : 'Focus only on the main domain (no subdomains).',
                autoScan
                    ? 'Start active recon immediately after target is added.'
                    : 'Prepare recon plan but do not start active scanning until explicitly requested.',
                notifyOnComplete
                    ? 'When recon completes, prepare a short notification-style summary for the operator.'
                    : '',
                customPrompt.trim() ? `Operator custom instructions: ${customPrompt.trim()}.` : '',
                'Plan and execute a full recon workflow (DNS, subdomains, ports, tech stack fingerprinting, screenshots, interesting endpoints, potential attack surface).',
                'Output next steps clearly so exploitation flows can be built on top of these findings.',
            ]
                .filter(Boolean)
                .join(' ');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Target added & recon started', {
                    description:
                        providerName && providers.length
                            ? `${trimmed} • ${getProviderDisplayName({
                                  name: providerName,
                                  type: providers[0]?.type ?? ProviderType.Anthropic,
                              })}`
                            : trimmed,
                });
                setDomain('');
                setScopeType('web');
                setIncludeSubdomains(true);
                setAutoScan(true);
                setNotifyOnComplete(false);
                setCustomPrompt('');
                setOpen(false);

                // remember we want a notification when this flow completes
                if (notifyOnComplete && typeof window !== 'undefined') {
                    const current = loadNotifyMap();
                    current[id] = true;
                    saveNotifyMap(current);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            onOpenChange={setOpen}
            open={open}
        >
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="size-4" />
                    Add Target
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="border-b border-muted/50 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <Radar className="size-4 text-primary" />
                        </div>
                        Add New Target
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Domain, IP or URL</label>
                        <Input
                            autoComplete="off"
                            className="h-10"
                            onChange={(event) => setDomain(event.target.value)}
                            placeholder="example.org, 192.168.1.1, or https://target.com"
                            value={domain}
                        />
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-semibold">Scope Type</span>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                className="w-full transition-all"
                                onClick={() => setScopeType('web')}
                                size="sm"
                                variant={scopeType === 'web' ? 'default' : 'outline'}
                            >
                                Web
                            </Button>
                            <Button
                                className="w-full transition-all"
                                onClick={() => setScopeType('api')}
                                size="sm"
                                variant={scopeType === 'api' ? 'default' : 'outline'}
                            >
                                API
                            </Button>
                            <Button
                                className="w-full transition-all"
                                onClick={() => setScopeType('mobile')}
                                size="sm"
                                variant={scopeType === 'mobile' ? 'default' : 'outline'}
                            >
                                Mobile
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-semibold">Custom prompt (optional)</span>
                        <TextareaAutosize
                            className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            minRows={3}
                            maxRows={5}
                            onChange={(event) => setCustomPrompt(event.target.value)}
                            placeholder="Special recon focus or instructions (e.g. focus on login endpoints, GraphQL, or admin panels)…"
                            value={customPrompt}
                        />
                    </div>

                    <div className="space-y-3 rounded-lg border border-muted/50 bg-muted/20 p-4">
                        <span className="text-sm font-semibold">Scan Options</span>
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                checked={autoScan}
                                className="size-4 rounded border border-border accent-primary"
                                onChange={(event) => setAutoScan(event.target.checked)}
                                type="checkbox"
                            />
                            <span>Auto-scan after adding</span>
                        </label>
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                checked={notifyOnComplete}
                                className="size-4 rounded border border-border accent-primary"
                                onChange={(event) => setNotifyOnComplete(event.target.checked)}
                                type="checkbox"
                            />
                            <span>Notify when scan completes</span>
                        </label>
                    </div>
                </div>
                <div className="border-t border-muted/50 pt-4">
                    <Button
                        className="w-full gap-2"
                        disabled={isSubmitting || !domain.trim()}
                        onClick={handleSubmit}
                        size="lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <Plus className="size-4" />
                                Create Target
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ReconTable = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows() as ReturnType<typeof useFlows> & {
        finishFlow: (flow: any) => Promise<boolean>;
    };

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);


    const mapStatusToRisk = (status: string) => {
        if (status === 'failed') return 'High';
        if (status === 'running' || status === 'waiting') return 'Medium';
        return 'Low';
    };

    // Notify when a watched flow transitions to finished/failed
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const notifyMap = loadNotifyMap();
        if (!Object.keys(notifyMap).length) return;

        let changed = false;

        flows.forEach((flow) => {
            if (!notifyMap[flow.id]) return;
            if (flow.status === 'finished' || flow.status === 'failed') {
                toast.info('Recon scan completed', {
                    description:
                        flow.title ||
                        `Flow ${flow.id} • Status: ${flow.status === 'finished' ? 'Finished' : 'Failed'}`,
                });
                delete notifyMap[flow.id];
                changed = true;
            }
        });

        if (changed) {
            saveNotifyMap(notifyMap);
        }
    }, [flows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Radar className="size-4 text-primary" />
                            </div>
                            <span>Recon Targets</span>
                        </span>
                        <ReconCreateForm />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>Target / Flow</span>
                            <span>Status</span>
                            <span>Risk</span>
                            <span>Findings</span>
                            <span>AI Analysis</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading recon flows…</p>
                        </div>
                    ) : !flows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Radar className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No recon flows yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Create one by clicking "Add Target" above
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {flows.map((flow) => (
                                <div
                                    className="group grid w-full grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm cursor-pointer"
                                    key={flow.id}
                                    onClick={() =>
                                        workspaceId &&
                                        navigate(
                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                        )
                                    }
                                >
                                    <span className="truncate font-semibold text-foreground">
                                        {flow.title || `Flow ${String(flow.id || '').slice(0, 8)}`}
                                    </span>
                                    <span>
                                        <Badge
                                            className="text-xs capitalize font-medium"
                                            variant={
                                                flow.status === 'failed'
                                                    ? 'destructive'
                                                    : flow.status === 'finished'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {flow.status.toLowerCase()}
                                        </Badge>
                                    </span>
                                    <span className="text-xs font-medium">
                                        <Badge
                                            className="text-xs"
                                            variant={
                                                mapStatusToRisk(flow.status) === 'High'
                                                    ? 'destructive'
                                                    : mapStatusToRisk(flow.status) === 'Medium'
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {mapStatusToRisk(flow.status)}
                                        </Badge>
                                    </span>
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                        {flow.status === 'failed'
                                            ? 'High risk: recon flow failed – investigate logs.'
                                            : flow.status === 'finished'
                                            ? 'Recon completed. Review findings and move to AI Attack Flow.'
                                            : 'Recon in progress – AI is still mapping the surface.'}
                                    </span>
                                    <span className="flex items-center justify-end gap-2">
                                        {flow.status === 'running' || flow.status === 'waiting' ? (
                                            <Button
                                                onClick={async (event) => {
                                                    event.stopPropagation();
                                                    await finishFlow(flow as any);
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                Stop
                                            </Button>
                                        ) : null}
                                        <Button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                navigate(`/flows/${flow.id}`);
                                            }}
                                            size="xs"
                                            variant="outline"
                                        >
                                            View
                                        </Button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const ReconSection = () => (
    <FlowsProvider>
        <ReconTable />
    </FlowsProvider>
);
const AIAttackFlowInnerSection = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    const searchFlowId = searchParams.get('flowId');
    const defaultFlowId = flows[0]?.id ?? null;
    const flowId = searchFlowId || defaultFlowId || null;

    // Auto-select first flow if no flowId in URL and flows are loaded
    useEffect(() => {
        if (!isLoading && !searchFlowId && defaultFlowId && flows.length > 0) {
            setSearchParams({ flowId: defaultFlowId }, { replace: true });
        }
    }, [isLoading, searchFlowId, defaultFlowId, flows.length, setSearchParams]);

    const handleFlowSelect = (selectedFlowId: string) => {
        setSearchParams({ flowId: selectedFlowId }, { replace: true });
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-[calc(100dvh-3rem)] flex-1 flex-col items-center justify-center">
                <Card className="border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm max-w-md">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Workflow className="size-4 text-primary" />
                            </div>
                            AI Attack Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Loading recon flows...</p>
                        <p className="mt-1 text-xs text-muted-foreground">Please wait while we fetch your flows</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show empty state only after flows have loaded
    if (!flows.length) {
        return (
            <div className="flex h-[calc(100dvh-3rem)] flex-1 flex-col items-center justify-center">
                <Card className="border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm max-w-md">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Workflow className="size-4 text-primary" />
                            </div>
                            AI Attack Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                            <Workflow className="size-8 text-primary/60" />
                        </div>
                        <p className="text-base font-semibold">No recon flows found</p>
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                            Go to Recon Engine and add a target to start your first recon flow. Once a flow is created,
                            you can view its detailed attack graph, tasks, and execution logs here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100dvh-3rem)] flex-1 flex-col gap-6 p-1">
            <Card className="border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <Workflow className="size-4 text-primary" />
                        </div>
                        <div className="flex-1">
                            <span>AI Attack Flow</span>
                            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                Select a flow from the left panel to view its detailed execution timeline, tasks, and
                                attack surface analysis
                            </p>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Split-pane layout: Left = Flows list, Right = Flow detail */}
            <ResizablePanelGroup
                className="flex-1 rounded-md border"
                direction="horizontal"
            >
                {/* Left Panel: Flows List */}
                <ResizablePanel
                    defaultSize={30}
                    minSize={20}
                >
                    <div className="flex h-full flex-col border-r bg-background">
                        {/* Professional Header */}
                        <div className="border-b border-muted/50 bg-gradient-to-br from-muted/50 via-muted/30 to-transparent px-6 py-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-1.5">
                                    <Radar className="size-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold tracking-tight">
                                        Recon Flows
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                            ({flows.length})
                                        </span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Select a flow to view execution details
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Flows List */}
                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-border/40">
                                {flows.map((flow) => {
                                    const isSelected = String(flow.id || '') === String(flowId || '');
                                    return (
                                        <button
                                            className={`group relative w-full px-6 py-4 text-left transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-primary/10 border-l-2 border-l-primary shadow-sm'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                            key={flow.id}
                                            onClick={() => handleFlowSelect(String(flow.id || ''))}
                                            type="button"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 shrink-0">
                                                    <FlowStatusIcon
                                                        status={flow.status}
                                                        tooltip={formatName(flow.status)}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate text-sm font-semibold leading-snug text-foreground">
                                                        {flow.title || `Flow ${String(flow.id || '').slice(0, 8)}`}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Badge
                                                            className="text-xs capitalize font-medium"
                                                            variant={
                                                                flow.status === 'failed'
                                                                    ? 'destructive'
                                                                    : flow.status === 'finished'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {flow.status.toLowerCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle>
                    <GripVertical className="size-4" />
                </ResizableHandle>

                {/* Right Panel: Selected Flow Detail - Only Tasks */}
                <ResizablePanel
                    defaultSize={70}
                    minSize={40}
                >
                    {flowId ? (
                        <FlowProvider flowIdOverride={flowId}>
                            <div className="flex h-full flex-col overflow-hidden border-l bg-background">
                                {/* Professional Header */}
                                <div className="border-b border-muted/50 bg-gradient-to-br from-muted/50 via-muted/30 to-transparent px-6 py-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-primary/10 p-1.5">
                                            <Workflow className="size-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold tracking-tight">Task Execution</h3>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Live view of this recon flow&apos;s tasks and subtasks
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Tasks Content */}
                                <div className="flex-1 overflow-hidden">
                                    <FlowTasks />
                                </div>
                            </div>
                        </FlowProvider>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/20 via-background to-muted/10 p-8">
                            <div className="text-center max-w-sm">
                                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
                                    <Workflow className="size-10 text-primary/60" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold tracking-tight">No Flow Selected</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Select a recon flow from the left panel to view its task execution details,
                                    progress tracking, and subtask breakdown.
                                </p>
                            </div>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export const AIAttackFlowSection = () => (
    <FlowsProvider>
        <AIAttackFlowInnerSection />
    </FlowsProvider>
);

const AutoGeneratePoCButton = ({ reconFlowId, reconFlowTitle }: { reconFlowId: string; reconFlowTitle: string }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleAutoGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const message = [
                'You are an automated PoC (Proof of Concept) generator for offensive security testing.',
                `Analyze the recon findings from flow "${reconFlowTitle}" (Flow ID: ${reconFlowId}).`,
                'Automatically detect all vulnerabilities found during recon.',
                'For each detected vulnerability, generate a production-ready PoC script.',
                'Include:',
                '- Python scripts for RCE, SQL injection, XSS, XXE, SSRF, and other web vulnerabilities',
                '- cURL commands for HTTP-based exploits',
                '- Bash scripts for command injection and path traversal',
                '- JSON payloads for API-based vulnerabilities',
                '- Clear comments explaining each step',
                '- Proper error handling',
                '- Expected output/response',
                '- Verification commands',
                '- Safe testing instructions',
                'Generate PoCs for ALL detected vulnerabilities automatically.',
                'Organize PoCs by vulnerability type and target endpoint.',
                'Make each PoC production-ready and well-documented.',
            ].join(' ');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Auto-generating PoCs from recon findings', {
                    description: `Analyzing ${reconFlowTitle} and generating PoCs for all detected vulnerabilities`,
                });
            }
        } catch (error) {
            toast.error('Failed to auto-generate PoCs', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            className="gap-2"
            disabled={isGenerating}
            onClick={handleAutoGenerate}
            size="xs"
            variant="outline"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="size-3 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <FlaskConical className="size-3" />
                    Auto-Generate PoCs
                </>
            )}
        </Button>
    );
};

const PoCMakerInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    // Filter flows that are PoC-related (title contains "PoC" or created via PoC Maker)
    const pocFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            return (
                title.includes('poc') ||
                title.includes('proof of concept') ||
                title.includes('exploit') ||
                title.includes('script') ||
                title.includes('generate poc') ||
                title.includes('auto-generate')
            );
        });
    }, [flows]);

    // Get completed recon flows that can be used to auto-generate PoCs
    const completedReconFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            const isRecon = title.includes('recon') || title.includes('target') || title.includes('scan');
            const isCompleted = flow.status === 'finished';
            const hasNoPoc = !pocFlows.some((poc) => poc.title?.toLowerCase().includes(flow.id?.toString() || ''));
            return isRecon && isCompleted && hasNoPoc;
        });
    }, [flows, pocFlows]);

    const stats = useMemo(() => {
        const total = pocFlows.length;
        const active = pocFlows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = pocFlows.filter((f) => f.status === 'finished').length;
        const failed = pocFlows.filter((f) => f.status === 'failed').length;
        return { total, active, completed, failed };
    }, [pocFlows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Total PoCs</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 transition-transform group-hover:scale-110">
                            <FlaskConical className="size-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                        <p className="mt-1 text-xs text-muted-foreground">PoC scripts generated</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-emerald-950/10 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Active</CardTitle>
                        <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                            <Workflow className="size-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Generating now</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-sky-950/10 transition-all duration-300 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Completed</CardTitle>
                        <div className="rounded-lg bg-sky-500/10 p-2 transition-transform group-hover:scale-110">
                            <FlaskConical className="size-4 text-sky-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-sky-400">{stats.completed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Ready to use</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-red-950/10 transition-all duration-300 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Failed</CardTitle>
                        <div className="rounded-lg bg-red-500/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-red-400">{stats.failed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Need attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Auto-Generate from Recon Findings */}
            {completedReconFlows.length > 0 && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                                    <Radar className="size-4 text-emerald-400" />
                                </div>
                                <span>Auto-Generate PoCs from Recon Findings</span>
                            </span>
                            <Badge
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                variant="outline"
                            >
                                {completedReconFlows.length} available
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {completedReconFlows.map((flow) => {
                                const flowTitle = flow.title || `Recon Flow ${String(flow.id || '').slice(0, 8)}`;
                                const hasExistingPoc = pocFlows.some(
                                    (poc) =>
                                        poc.title?.toLowerCase().includes(flow.id?.toString() || '') ||
                                        poc.title?.toLowerCase().includes(flowTitle.toLowerCase()),
                                );

                                return (
                                    <div
                                        className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/20"
                                        key={flow.id}
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex size-5 items-center justify-center rounded border-2 border-muted bg-background transition-colors group-hover:border-primary/50">
                                                <div className="size-2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-sm text-foreground">
                                                        {flowTitle}
                                                    </div>
                                                    {hasExistingPoc && (
                                                        <Badge
                                                            className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20"
                                                            variant="outline"
                                                        >
                                                            PoC Generated
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Flow ID: {String(flow.id || '').slice(0, 12)}</span>
                                                    <span>•</span>
                                                    <span>Status: {flow.status}</span>
                                                    {hasExistingPoc && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-sky-400">PoC already exists</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                className="gap-2"
                                                onClick={() =>
                                                    workspaceId &&
                                                    navigate(
                                                        `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                    )
                                                }
                                                size="xs"
                                                variant="ghost"
                                            >
                                                View Recon
                                            </Button>
                                            <AutoGeneratePoCButton
                                                reconFlowId={String(flow.id || '')}
                                                reconFlowTitle={flowTitle}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {completedReconFlows.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-8">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                                    <Radar className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">No completed recon flows</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Complete a recon scan first to generate PoCs
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <FlaskConical className="size-4 text-primary" />
                        </div>
                        <span>Auto-Generated PoC Scripts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>PoC / Flow</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Details</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading PoC scripts…</p>
                        </div>
                    ) : !pocFlows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <FlaskConical className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No PoC scripts yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Complete a recon scan and use "Auto-Generate PoCs" above to create PoCs automatically
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {pocFlows.map((flow) => {
                                const title = flow.title || '';
                                const vulnType = title.toLowerCase().includes('sql')
                                    ? 'SQLi'
                                    : title.toLowerCase().includes('xss')
                                    ? 'XSS'
                                    : title.toLowerCase().includes('rce')
                                    ? 'RCE'
                                    : title.toLowerCase().includes('xxe')
                                    ? 'XXE'
                                    : title.toLowerCase().includes('ssrf')
                                    ? 'SSRF'
                                    : 'Other';

                                return (
                                    <button
                                        className="group grid w-full grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm"
                                        key={flow.id}
                                        onClick={() =>
                                            workspaceId &&
                                            navigate(
                                                `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                            )
                                        }
                                        type="button"
                                    >
                                        <span className="truncate font-semibold text-foreground">
                                            {title || `PoC ${String(flow.id || '').slice(0, 8)}`}
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs capitalize font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs font-medium"
                                                variant="outline"
                                            >
                                                {vulnType}
                                            </Badge>
                                        </span>
                                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {flow.status === 'failed'
                                                ? 'PoC generation failed – check logs for details.'
                                                : flow.status === 'finished'
                                                ? 'PoC script ready. View in AI Attack Flow to see the generated code.'
                                                : 'Generating PoC script...'}
                                        </span>
                                        <span className="flex items-center justify-end gap-2">
                                            {flow.status === 'running' || flow.status === 'waiting' ? (
                                                <Button
                                                    onClick={async (event) => {
                                                        event.stopPropagation();
                                                        await finishFlow(flow as any);
                                                    }}
                                                    size="xs"
                                                    variant="outline"
                                                >
                                                    Stop
                                                </Button>
                                            ) : null}
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    workspaceId &&
                                                        navigate(
                                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                        );
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const PoCMakerSection = () => (
    <FlowsProvider>
        <PoCMakerInner />
    </FlowsProvider>
);

const ManualPayloadForm = () => {
    const [open, setOpen] = useState(false);
    const [targetUrl, setTargetUrl] = useState('');
    const [vulnerabilityType, setVulnerabilityType] = useState<string>('sql-injection');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleSubmit = async () => {
        const trimmed = targetUrl.trim();
        const promptTrimmed = customPrompt.trim();

        if (!trimmed && !promptTrimmed) {
            toast.error('Please enter a target URL or vulnerability information');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const vulnTypeMap: Record<string, string> = {
                'sql-injection': 'SQL Injection',
                'xss': 'Cross-Site Scripting (XSS)',
                'command-injection': 'Command Injection',
                'path-traversal': 'Path Traversal',
                'xxe': 'XML External Entity (XXE)',
                'ssrf': 'Server-Side Request Forgery (SSRF)',
                'deserialization': 'Insecure Deserialization',
                'template-injection': 'Template Injection',
                'ldap-injection': 'LDAP Injection',
                'nosql-injection': 'NoSQL Injection',
                'all': 'All Types',
            };

            const message = [
                'You are a specialized Payload Generator for offensive security testing.',
                `Generate a comprehensive payload library for ${vulnTypeMap[vulnerabilityType]} vulnerability.`,
                trimmed ? `Target URL: ${trimmed}.` : '',
                promptTrimmed
                    ? `Vulnerability details and context: ${promptTrimmed}.`
                    : `Create a comprehensive payload library for ${vulnTypeMap[vulnerabilityType]}.`,
                'Include:',
                '- Multiple payload variations and bypass techniques',
                '- Encoded versions (URL encoding, Base64, HTML entities, Unicode, etc.)',
                '- Context-specific payloads (reflected, stored, DOM-based for XSS)',
                '- WAF bypass techniques',
                '- Platform-specific payloads (Windows, Linux, Unix)',
                '- Framework-specific payloads (PHP, Python, Java, Node.js, ASP.NET, etc.)',
                '- Database-specific payloads (MySQL, PostgreSQL, MSSQL, Oracle, MongoDB for NoSQL)',
                '- Filter bypass techniques',
                '- Obfuscation methods',
                '- Time-based and boolean-based payloads (for SQL Injection)',
                '- Event handler payloads (for XSS)',
                '- File inclusion payloads (for Path Traversal)',
                'Organize payloads by:',
                '- Vulnerability type',
                '- Encoding method',
                '- Target technology/framework',
                '- Bypass technique',
                '- Attack vector',
                'Make the payload library comprehensive, well-documented, and ready for use in penetration testing.',
            ]
                .filter(Boolean)
                .join(' ');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Payload generation started', {
                    description:
                        providerName && providers.length
                            ? `${vulnTypeMap[vulnerabilityType]} • ${getProviderDisplayName({
                                  name: providerName,
                                  type: providers[0]?.type ?? ProviderType.Anthropic,
                              })}`
                            : vulnTypeMap[vulnerabilityType],
                });
                setTargetUrl('');
                setVulnerabilityType('sql-injection');
                setCustomPrompt('');
                setOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            onOpenChange={setOpen}
            open={open}
        >
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="size-4" />
                    Generate Payloads
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="border-b border-muted/50 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <TerminalSquare className="size-4 text-primary" />
                        </div>
                        Generate Payload Library
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Target URL (Optional)</label>
                        <Input
                            autoComplete="off"
                            className="h-10"
                            onChange={(event) => setTargetUrl(event.target.value)}
                            placeholder="https://target.com/api/endpoint or http://target.com/search?q="
                            value={targetUrl}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the vulnerable URL or endpoint where you want to test payloads
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Vulnerability Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setVulnerabilityType(event.target.value)}
                            value={vulnerabilityType}
                        >
                            <option value="sql-injection">SQL Injection</option>
                            <option value="xss">Cross-Site Scripting (XSS)</option>
                            <option value="command-injection">Command Injection</option>
                            <option value="path-traversal">Path Traversal</option>
                            <option value="xxe">XML External Entity (XXE)</option>
                            <option value="ssrf">Server-Side Request Forgery (SSRF)</option>
                            <option value="deserialization">Insecure Deserialization</option>
                            <option value="template-injection">Template Injection</option>
                            <option value="ldap-injection">LDAP Injection</option>
                            <option value="nosql-injection">NoSQL Injection</option>
                            <option value="all">All Types (Comprehensive Library)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">
                            Vulnerability Details / Custom Prompt (Optional)
                        </label>
                        <TextareaAutosize
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setCustomPrompt(event.target.value)}
                            placeholder="Example:&#10;- SQL Injection in login form, parameter: 'username'&#10;- XSS in search parameter, reflected in response&#10;- Command injection in file upload feature&#10;- Path traversal in file download endpoint&#10;&#10;Or provide any specific details about the vulnerability, target technology, filters, or WAF..."
                            value={customPrompt}
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide specific details about the vulnerability, parameters, target technology, filters, or
                            WAF. AI will analyze this and generate targeted payloads.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting || (!targetUrl.trim() && !customPrompt.trim())}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Payloads'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AutoGeneratePayloadButton = ({
    reconFlowId,
    reconFlowTitle,
    payloadType,
}: {
    reconFlowId: string;
    reconFlowTitle: string;
    payloadType?: string;
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleAutoGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const payloadTypeMap: Record<string, string> = {
                'sql-injection': 'SQL Injection payloads',
                'xss': 'Cross-Site Scripting (XSS) payloads',
                'command-injection': 'Command Injection payloads',
                'path-traversal': 'Path Traversal payloads',
                'xxe': 'XML External Entity (XXE) payloads',
                'ssrf': 'Server-Side Request Forgery (SSRF) payloads',
                'deserialization': 'Deserialization payloads',
                'template-injection': 'Template Injection payloads',
                'all': 'all types of payloads',
            };

            const selectedType = payloadType || 'all';

            const message = [
                'You are a specialized Payload Generator for offensive security testing.',
                `Analyze the recon findings from flow "${reconFlowTitle}" (Flow ID: ${reconFlowId}).`,
                `Generate a comprehensive library of ${payloadTypeMap[selectedType] || 'payloads'} based on the detected vulnerabilities and target technology stack.`,
                'For each payload type, include:',
                '- Multiple variations and bypass techniques',
                '- Encoded versions (URL, Base64, HTML entities, etc.)',
                '- Context-specific payloads (reflected, stored, DOM-based)',
                '- WAF bypass techniques',
                '- Platform-specific payloads (Windows, Linux, etc.)',
                '- Framework-specific payloads (PHP, Python, Java, Node.js, etc.)',
                '- Filter bypass techniques',
                '- Obfuscation methods',
                'Organize payloads by:',
                '- Vulnerability type',
                '- Encoding method',
                '- Target technology',
                '- Bypass technique',
                'Make the payload library comprehensive, well-documented, and ready for use in penetration testing.',
            ].join(' ');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id) {
                toast.success('Auto-generating payload library', {
                    description: `Generating ${payloadTypeMap[selectedType] || 'payloads'} from ${reconFlowTitle}`,
                });
            }
        } catch (error) {
            toast.error('Failed to auto-generate payloads', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            className="gap-2"
            disabled={isGenerating}
            onClick={handleAutoGenerate}
            size="xs"
            variant="outline"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="size-3 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <TerminalSquare className="size-3" />
                    Generate Payloads
                </>
            )}
        </Button>
    );
};

const PayloadGeneratorInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    // Filter flows that are payload-related
    const payloadFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            return (
                title.includes('payload') ||
                title.includes('sql injection payload') ||
                title.includes('xss payload') ||
                title.includes('command injection payload') ||
                title.includes('generate payload') ||
                title.includes('payload library')
            );
        });
    }, [flows]);

    // Get completed recon flows that can be used to auto-generate payloads
    const completedReconFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            const isRecon = title.includes('recon') || title.includes('target') || title.includes('scan');
            const isCompleted = flow.status === 'finished';
            return isRecon && isCompleted;
        });
    }, [flows]);

    const stats = useMemo(() => {
        const total = payloadFlows.length;
        const active = payloadFlows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = payloadFlows.filter((f) => f.status === 'finished').length;
        const failed = payloadFlows.filter((f) => f.status === 'failed').length;
        return { total, active, completed, failed };
    }, [payloadFlows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Total Payloads</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 transition-transform group-hover:scale-110">
                            <TerminalSquare className="size-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Payload libraries generated</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-emerald-950/10 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Active</CardTitle>
                        <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                            <Workflow className="size-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Generating now</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-sky-950/10 transition-all duration-300 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Completed</CardTitle>
                        <div className="rounded-lg bg-sky-500/10 p-2 transition-transform group-hover:scale-110">
                            <TerminalSquare className="size-4 text-sky-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-sky-400">{stats.completed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Ready to use</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-red-950/10 transition-all duration-300 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Failed</CardTitle>
                        <div className="rounded-lg bg-red-500/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-red-400">{stats.failed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Need attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Auto-Generate from Recon Findings */}
            {completedReconFlows.length > 0 && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                                    <Radar className="size-4 text-emerald-400" />
                                </div>
                                <span>Auto-Generate Payloads from Recon Findings</span>
                            </span>
                            <Badge
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                variant="outline"
                            >
                                {completedReconFlows.length} available
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {completedReconFlows.map((flow) => {
                                const flowTitle = flow.title || `Recon Flow ${String(flow.id || '').slice(0, 8)}`;
                                const hasExistingPayload = payloadFlows.some(
                                    (payload) =>
                                        payload.title?.toLowerCase().includes(flow.id?.toString() || '') ||
                                        payload.title?.toLowerCase().includes(flowTitle.toLowerCase()),
                                );

                                return (
                                    <div
                                        className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/20"
                                        key={flow.id}
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex size-5 items-center justify-center rounded border-2 border-muted bg-background transition-colors group-hover:border-primary/50">
                                                <div className="size-2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-sm text-foreground">
                                                        {flowTitle}
                                                    </div>
                                                    {hasExistingPayload && (
                                                        <Badge
                                                            className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20"
                                                            variant="outline"
                                                        >
                                                            Payloads Generated
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Flow ID: {String(flow.id || '').slice(0, 12)}</span>
                                                    <span>•</span>
                                                    <span>Status: {flow.status}</span>
                                                    {hasExistingPayload && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-sky-400">Payloads already exist</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                className="gap-2"
                                                onClick={() =>
                                                    workspaceId &&
                                                    navigate(
                                                        `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                    )
                                                }
                                                size="xs"
                                                variant="ghost"
                                            >
                                                View Recon
                                            </Button>
                                            <AutoGeneratePayloadButton
                                                reconFlowId={String(flow.id || '')}
                                                reconFlowTitle={flowTitle}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {completedReconFlows.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-8">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                                    <Radar className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">No completed recon flows</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Complete a recon scan first to generate payloads
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <TerminalSquare className="size-4 text-primary" />
                            </div>
                            <span>Payload Libraries</span>
                        </span>
                        <ManualPayloadForm />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>Payload Library / Flow</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Details</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading payload libraries…</p>
                        </div>
                    ) : !payloadFlows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <TerminalSquare className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No payload libraries yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Complete a recon scan and use "Auto-Generate Payloads" above to create payload libraries automatically
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {payloadFlows.map((flow) => {
                                const title = flow.title || '';
                                const payloadType = title.toLowerCase().includes('sql')
                                    ? 'SQLi'
                                    : title.toLowerCase().includes('xss')
                                    ? 'XSS'
                                    : title.toLowerCase().includes('command')
                                    ? 'Cmd Inj'
                                    : title.toLowerCase().includes('path')
                                    ? 'Path Trav'
                                    : title.toLowerCase().includes('xxe')
                                    ? 'XXE'
                                    : title.toLowerCase().includes('ssrf')
                                    ? 'SSRF'
                                    : 'Multi';

                                return (
                                    <button
                                        className="group grid w-full grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm"
                                        key={flow.id}
                                        onClick={() =>
                                            workspaceId &&
                                            navigate(
                                                `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                            )
                                        }
                                        type="button"
                                    >
                                        <span className="truncate font-semibold text-foreground">
                                            {title || `Payload Library ${String(flow.id || '').slice(0, 8)}`}
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs capitalize font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs font-medium"
                                                variant="outline"
                                            >
                                                {payloadType}
                                            </Badge>
                                        </span>
                                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {flow.status === 'failed'
                                                ? 'Payload generation failed – check logs for details.'
                                                : flow.status === 'finished'
                                                ? 'Payload library ready. View in AI Attack Flow to see all generated payloads.'
                                                : 'Generating payload library...'}
                                        </span>
                                        <span className="flex items-center justify-end gap-2">
                                            {flow.status === 'running' || flow.status === 'waiting' ? (
                                                <Button
                                                    onClick={async (event) => {
                                                        event.stopPropagation();
                                                        await finishFlow(flow as any);
                                                    }}
                                                    size="xs"
                                                    variant="outline"
                                                >
                                                    Stop
                                                </Button>
                                            ) : null}
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    workspaceId &&
                                                        navigate(
                                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                        );
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const PayloadGeneratorSection = () => (
    <FlowsProvider>
        <PayloadGeneratorInner />
    </FlowsProvider>
);

const ZeroDayAutoAnalyzeButton = ({
    reconFlowId,
    reconFlowTitle,
}: {
    reconFlowId: string;
    reconFlowTitle: string;
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleAnalyze = async () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);

        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const message = `Analyze recon findings from "${reconFlowTitle}" (Flow ID: ${reconFlowId}) for potential zero-day vulnerabilities. Perform deep analysis of all endpoints, unusual behaviors, error patterns, and potential exploit vectors. Focus on finding novel vulnerabilities that are not publicly known. Include fuzzing suggestions, crash pattern analysis, and exploit development research.`;

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Zero-day analysis started', {
                    description: `Analyzing ${reconFlowTitle} for zero-day vulnerabilities`,
                });
            }
        } catch (error) {
            toast.error('Failed to start zero-day analysis', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Button
            className="gap-2 border-amber-400/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            disabled={isAnalyzing}
            onClick={handleAnalyze}
            size="xs"
            variant="outline"
        >
            {isAnalyzing ? (
                <>
                    <Loader2 className="size-3 animate-spin" />
                    Analyzing...
                </>
            ) : (
                <>
                    <ShieldAlert className="size-3" />
                    Analyze for Zero-Days
                </>
            )}
        </Button>
    );
};

const ZeroDayAnalysisForm = () => {
    const [open, setOpen] = useState(false);
    const [targetUrl, setTargetUrl] = useState('');
    const [analysisType, setAnalysisType] = useState<string>('fuzzing');
    const [crashData, setCrashData] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleSubmit = async () => {
        const trimmed = targetUrl.trim();
        const crashTrimmed = crashData.trim();
        const promptTrimmed = customPrompt.trim();

        if (!trimmed && !crashTrimmed && !promptTrimmed) {
            toast.error('Please provide target URL, crash data, or analysis details');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const analysisTypeMap: Record<string, string> = {
                fuzzing: 'Fuzzing-based zero-day discovery',
                'crash-analysis': 'Crash pattern analysis',
                'behavior-analysis': 'Unusual behavior analysis',
                'exploit-research': 'Exploit development research',
                'vulnerability-chaining': 'Vulnerability chaining analysis',
                'novel-attack': 'Novel attack vector research',
                'binary-analysis': 'Binary analysis and reverse engineering',
                'protocol-fuzzing': 'Protocol fuzzing and analysis',
            };

            const message = [
                'You are an advanced Zero-Day Vulnerability Researcher specializing in discovering novel security vulnerabilities.',
                `Perform ${analysisTypeMap[analysisType]} to identify potential zero-day vulnerabilities.`,
                trimmed ? `Target: ${trimmed}.` : '',
                crashTrimmed
                    ? `Crash data and error patterns:\n${crashTrimmed}\n\nAnalyze these crashes for exploitable conditions, memory corruption, race conditions, or logic flaws.`
                    : '',
                promptTrimmed
                    ? `Analysis context and requirements:\n${promptTrimmed}`
                    : '',
                'Your research should include:',
                '- Deep analysis of crash patterns and error conditions',
                '- Identification of exploitable memory corruption vulnerabilities',
                '- Race condition detection',
                '- Logic flaw discovery',
                '- Input validation bypass techniques',
                '- Unusual behavior pattern analysis',
                '- Protocol-level vulnerabilities',
                '- Binary-level vulnerability analysis',
                '- Exploitability assessment',
                '- Proof-of-concept exploit development',
                '- Vulnerability chaining opportunities',
                '- Novel attack vectors',
                'Focus on finding vulnerabilities that are:',
                '- Not publicly known (zero-day)',
                '- High impact (RCE, privilege escalation, authentication bypass)',
                '- Exploitable in real-world scenarios',
                '- Novel or using uncommon techniques',
                'Document findings with:',
                '- Detailed vulnerability description',
                '- Affected components and versions',
                '- Exploitation steps',
                '- Proof-of-concept code',
                '- Impact assessment',
                '- Remediation recommendations',
                'Think creatively and explore edge cases, unusual code paths, and unexpected interactions.',
            ]
                .filter(Boolean)
                .join(' ');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Zero-day analysis started', {
                    description:
                        providerName && providers.length
                            ? `${analysisTypeMap[analysisType]} • ${getProviderDisplayName({
                                  name: providerName,
                                  type: providers[0]?.type ?? ProviderType.Anthropic,
                              })}`
                            : analysisTypeMap[analysisType],
                });
                setTargetUrl('');
                setAnalysisType('fuzzing');
                setCrashData('');
                setCustomPrompt('');
                setOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            onOpenChange={setOpen}
            open={open}
        >
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="size-4" />
                    Start Zero-Day Research
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b border-muted/50 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <ShieldAlert className="size-4 text-primary" />
                        </div>
                        Zero-Day Vulnerability Research
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <div className="flex items-start gap-2">
                            <ShieldAlert className="mt-0.5 size-4 text-amber-400 shrink-0" />
                            <div className="text-xs text-amber-400/90">
                                <strong>Advanced Research Mode:</strong> This tool performs deep vulnerability research
                                to discover zero-day vulnerabilities. Use responsibly and only on systems you own or
                                have explicit permission to test.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Target URL / Endpoint</label>
                        <Input
                            autoComplete="off"
                            className="h-10"
                            onChange={(event) => setTargetUrl(event.target.value)}
                            placeholder="https://target.com/api/endpoint or binary/executable path"
                            value={targetUrl}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the target application, API endpoint, or binary to analyze
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Analysis Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setAnalysisType(event.target.value)}
                            value={analysisType}
                        >
                            <option value="fuzzing">Fuzzing-based Discovery</option>
                            <option value="crash-analysis">Crash Pattern Analysis</option>
                            <option value="behavior-analysis">Unusual Behavior Analysis</option>
                            <option value="exploit-research">Exploit Development Research</option>
                            <option value="vulnerability-chaining">Vulnerability Chaining</option>
                            <option value="novel-attack">Novel Attack Vector Research</option>
                            <option value="binary-analysis">Binary Analysis & Reverse Engineering</option>
                            <option value="protocol-fuzzing">Protocol Fuzzing & Analysis</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Crash Data / Error Patterns (Optional)</label>
                        <TextareaAutosize
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                            onChange={(event) => setCrashData(event.target.value)}
                            placeholder="Paste crash logs, stack traces, error messages, or fuzzing results here...&#10;&#10;Example:&#10;Segmentation fault at 0x41414141&#10;Access violation reading 0x41414141&#10;Heap corruption detected&#10;Double free detected"
                            value={crashData}
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide crash logs, stack traces, or fuzzing results for analysis
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Custom Research Requirements (Optional)</label>
                        <TextareaAutosize
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setCustomPrompt(event.target.value)}
                            placeholder="Example:&#10;- Focus on authentication bypass vulnerabilities&#10;- Analyze file upload functionality for RCE&#10;- Research memory corruption in custom protocol parser&#10;- Look for race conditions in multi-threaded code&#10;&#10;Or provide specific research goals, target components, or areas of interest..."
                            value={customPrompt}
                        />
                        <p className="text-xs text-muted-foreground">
                            Specify research focus areas, target components, or specific vulnerability types to
                            investigate
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting || (!targetUrl.trim() && !crashData.trim() && !customPrompt.trim())}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Start Research'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ZeroDayFinderInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    // Filter flows that are zero-day research related
    const zeroDayFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            return (
                title.includes('zero-day') ||
                title.includes('zero day') ||
                title.includes('fuzzing') ||
                title.includes('crash') ||
                title.includes('exploit research') ||
                title.includes('vulnerability chaining') ||
                title.includes('novel attack') ||
                title.includes('binary analysis')
            );
        });
    }, [flows]);

    // Get completed recon flows that can be analyzed for zero-days
    const completedReconFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            const isRecon = title.includes('recon') || title.includes('target') || title.includes('scan');
            const isCompleted = flow.status === 'finished';
            return isRecon && isCompleted;
        });
    }, [flows]);

    const stats = useMemo(() => {
        const total = zeroDayFlows.length;
        const active = zeroDayFlows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = zeroDayFlows.filter((f) => f.status === 'finished').length;
        const critical = zeroDayFlows.filter((f) => {
            const title = (f.title || '').toLowerCase();
            return title.includes('rce') || title.includes('critical') || title.includes('exploitable');
        }).length;
        return { total, active, completed, critical };
    }, [zeroDayFlows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Research Projects</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Zero-day research flows</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-emerald-950/10 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Active Research</CardTitle>
                        <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                            <Workflow className="size-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Currently analyzing</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-amber-950/10 transition-all duration-300 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Critical Findings</CardTitle>
                        <div className="rounded-lg bg-amber-500/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-amber-400">{stats.critical}</div>
                        <p className="mt-1 text-xs text-muted-foreground">High-impact vulnerabilities</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-sky-950/10 transition-all duration-300 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Completed</CardTitle>
                        <div className="rounded-lg bg-sky-500/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-sky-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-sky-400">{stats.completed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Research completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Info Banner */}
            <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
                <CardContent className="flex items-start gap-3 p-4">
                    <ShieldAlert className="mt-0.5 size-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-amber-400">Zero-Day Vulnerability Research</div>
                        <div className="mt-1 text-xs text-amber-400/80">
                            This advanced tool performs deep vulnerability research to discover zero-day vulnerabilities
                            through fuzzing, crash analysis, behavior analysis, and exploit development. Use
                            responsibly and only on systems you own or have explicit permission to test.
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auto-Analyze from Recon Findings */}
            {completedReconFlows.length > 0 && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                                    <Radar className="size-4 text-emerald-400" />
                                </div>
                                <span>Deep Analysis from Recon Findings</span>
                            </span>
                            <Badge
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                variant="outline"
                            >
                                {completedReconFlows.length} available
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {completedReconFlows.slice(0, 3).map((flow) => {
                                const flowTitle = flow.title || `Recon Flow ${String(flow.id || '').slice(0, 8)}`;

                                return (
                                    <div
                                        className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/20"
                                        key={flow.id}
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex size-5 items-center justify-center rounded border-2 border-muted bg-background transition-colors group-hover:border-amber-400/50">
                                                <div className="size-2 rounded-full bg-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-foreground">{flowTitle}</div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Flow ID: {String(flow.id || '').slice(0, 12)}</span>
                                                    <span>•</span>
                                                    <span>Status: {flow.status}</span>
                                                    <span>•</span>
                                                    <span className="text-amber-400">Ready for zero-day analysis</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                className="gap-2"
                                                onClick={() =>
                                                    workspaceId &&
                                                    navigate(
                                                        `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                    )
                                                }
                                                size="xs"
                                                variant="ghost"
                                            >
                                                View Recon
                                            </Button>
                                            <ZeroDayAutoAnalyzeButton
                                                reconFlowId={String(flow.id || '')}
                                                reconFlowTitle={flowTitle}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <ShieldAlert className="size-4 text-primary" />
                            </div>
                            <span>Zero-Day Research Projects</span>
                        </span>
                        <ZeroDayAnalysisForm />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>Research Project / Flow</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Findings</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading research projects…</p>
                        </div>
                    ) : !zeroDayFlows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <ShieldAlert className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No zero-day research projects yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Start a new research project using "Start Zero-Day Research" above
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {zeroDayFlows.map((flow) => {
                                const title = flow.title || '';
                                const researchType = title.toLowerCase().includes('fuzzing')
                                    ? 'Fuzzing'
                                    : title.toLowerCase().includes('crash')
                                    ? 'Crash'
                                    : title.toLowerCase().includes('exploit')
                                    ? 'Exploit'
                                    : title.toLowerCase().includes('binary')
                                    ? 'Binary'
                                    : title.toLowerCase().includes('protocol')
                                    ? 'Protocol'
                                    : 'Research';

                                return (
                                    <button
                                        className="group grid w-full grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm"
                                        key={flow.id}
                                        onClick={() =>
                                            workspaceId &&
                                            navigate(
                                                `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                            )
                                        }
                                        type="button"
                                    >
                                        <span className="truncate font-semibold text-foreground">
                                            {title || `Research ${String(flow.id || '').slice(0, 8)}`}
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs capitalize font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs font-medium"
                                                variant="outline"
                                            >
                                                {researchType}
                                            </Badge>
                                        </span>
                                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {flow.status === 'failed'
                                                ? 'Research failed – check logs for details.'
                                                : flow.status === 'finished'
                                                ? 'Research completed. View findings and exploit details in AI Attack Flow.'
                                                : 'Analyzing for zero-day vulnerabilities...'}
                                        </span>
                                        <span className="flex items-center justify-end gap-2">
                                            {flow.status === 'running' || flow.status === 'waiting' ? (
                                                <Button
                                                    onClick={async (event) => {
                                                        event.stopPropagation();
                                                        await finishFlow(flow as any);
                                                    }}
                                                    size="xs"
                                                    variant="outline"
                                                >
                                                    Stop
                                                </Button>
                                            ) : null}
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    workspaceId &&
                                                        navigate(
                                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                        );
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const ZeroDayFinderSection = () => (
    <FlowsProvider>
        <ZeroDayFinderInner />
    </FlowsProvider>
);

const OSINTResearchForm = () => {
    const [open, setOpen] = useState(false);
    const [target, setTarget] = useState('');
    const [researchType, setResearchType] = useState<string>('comprehensive');
    const [customRequirements, setCustomRequirements] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleSubmit = async () => {
        const trimmed = target.trim();
        if (!trimmed) {
            toast.error('Please enter a target (domain, company name, or email)');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const researchTypeMap: Record<string, string> = {
                comprehensive: 'Comprehensive OSINT Research',
                domain: 'Domain & Subdomain Enumeration',
                email: 'Email Discovery & Verification',
                social: 'Social Media Intelligence',
                github: 'GitHub/GitLab Repository Analysis',
                employees: 'Employee Information Gathering',
                leaks: 'Leaked Credentials Search',
                infrastructure: 'Infrastructure Footprint Analysis',
                dns: 'DNS Enumeration & WHOIS',
                certificates: 'Certificate Transparency Logs',
            };

            const message = [
                'You are a specialized OSINT (Open Source Intelligence) Hunter for cybersecurity and bug bounty research.',
                `Perform ${researchTypeMap[researchType]} on target: ${trimmed}.`,
                customRequirements.trim()
                    ? `Specific research requirements:\n${customRequirements.trim()}`
                    : '',
                researchType === 'comprehensive'
                    ? [
                          'Conduct comprehensive OSINT research including:',
                          '- Domain and subdomain enumeration',
                          '- Email discovery and verification',
                          '- Social media intelligence gathering',
                          '- GitHub/GitLab repository analysis',
                          '- Employee information gathering',
                          '- Leaked credentials search',
                          '- Infrastructure footprint analysis',
                          '- DNS enumeration and WHOIS lookups',
                          '- Certificate transparency log analysis',
                          '- Technology stack identification',
                          '- Historical data and archives',
                      ]
                    : researchType === 'domain'
                    ? [
                          'Focus on domain and subdomain enumeration:',
                          '- Use subdomain enumeration tools (amass, subfinder, etc.)',
                          '- Check DNS records (A, AAAA, MX, TXT, CNAME)',
                          '- Analyze certificate transparency logs',
                          '- Check historical DNS records',
                          '- Identify related domains and infrastructure',
                      ]
                    : researchType === 'email'
                    ? [
                          'Focus on email discovery and verification:',
                          '- Find email addresses associated with the target',
                          '- Verify email addresses',
                          '- Check for email breaches and leaks',
                          '- Identify email patterns and formats',
                          '- Find email addresses in public sources',
                      ]
                    : researchType === 'social'
                    ? [
                          'Focus on social media intelligence:',
                          '- Search for profiles on LinkedIn, Twitter, GitHub, etc.',
                          '- Identify employees and their roles',
                          '- Find public posts and information',
                          '- Analyze social media activity',
                          '- Identify connections and relationships',
                      ]
                    : researchType === 'github'
                    ? [
                          'Focus on GitHub/GitLab repository analysis:',
                          '- Search for repositories related to the target',
                          '- Analyze code for sensitive information',
                          '- Check for exposed API keys and credentials',
                          '- Identify technology stack and dependencies',
                          '- Find commit history and contributors',
                      ]
                    : researchType === 'employees'
                    ? [
                          'Focus on employee information gathering:',
                          '- Identify employees and their roles',
                          '- Find email addresses and contact information',
                          '- Analyze LinkedIn profiles',
                          '- Identify organizational structure',
                          '- Find public information about employees',
                      ]
                    : researchType === 'leaks'
                    ? [
                          'Focus on leaked credentials search:',
                          '- Search for leaked credentials in public databases',
                          '- Check for data breaches',
                          '- Identify compromised accounts',
                          '- Analyze password patterns',
                          '- Find related leaked information',
                      ]
                    : researchType === 'infrastructure'
                    ? [
                          'Focus on infrastructure footprint analysis:',
                          '- Identify IP addresses and ranges',
                          '- Analyze network infrastructure',
                          '- Find cloud services and providers',
                          '- Identify CDN and hosting providers',
                          '- Map network topology',
                      ]
                    : researchType === 'dns'
                    ? [
                          'Focus on DNS enumeration and WHOIS:',
                          '- Enumerate DNS records',
                          '- Perform WHOIS lookups',
                          '- Analyze DNS history',
                          '- Identify DNS misconfigurations',
                          '- Find related domains',
                      ]
                    : [
                          'Focus on certificate transparency logs:',
                          '- Search certificate transparency logs',
                          '- Identify subdomains from certificates',
                          '- Analyze certificate details',
                          '- Find expired and active certificates',
                          '- Identify certificate authorities',
                      ],
                'Use appropriate OSINT tools and techniques:',
                '- Subdomain enumeration tools (amass, subfinder, etc.)',
                '- Email discovery tools (theHarvester, hunter.io, etc.)',
                '- Social media search and analysis',
                '- GitHub/GitLab API searches',
                '- DNS enumeration tools',
                '- Certificate transparency log searches',
                '- Public database searches',
                '- Web scraping and analysis',
                'Organize findings by:',
                '- Category (domains, emails, social media, etc.)',
                '- Source and reliability',
                '- Relevance and importance',
                '- Potential attack vectors',
                'Document all findings with:',
                '- Source URLs and references',
                '- Timestamps and dates',
                '- Confidence levels',
                '- Potential security implications',
                'Make the OSINT report comprehensive, well-organized, and actionable for penetration testing and bug bounty research.',
            ]
                .filter(Boolean)
                .flat()
                .join('\n');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('OSINT research started', {
                    description:
                        providerName && providers.length
                            ? `${researchTypeMap[researchType]} • ${getProviderDisplayName({
                                  name: providerName,
                                  type: providers[0]?.type ?? ProviderType.Anthropic,
                              })}`
                            : researchTypeMap[researchType],
                });
                setTarget('');
                setResearchType('comprehensive');
                setCustomRequirements('');
                setOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            onOpenChange={setOpen}
            open={open}
        >
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="size-4" />
                    Start OSINT Research
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="border-b border-muted/50 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <Map className="size-4 text-primary" />
                        </div>
                        OSINT Research
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Target</label>
                        <Input
                            autoComplete="off"
                            className="h-10"
                            onChange={(event) => setTarget(event.target.value)}
                            placeholder="example.com, company name, or email@example.com"
                            value={target}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter domain, company name, email, or any target for OSINT research
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Research Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setResearchType(event.target.value)}
                            value={researchType}
                        >
                            <option value="comprehensive">Comprehensive OSINT Research</option>
                            <option value="domain">Domain & Subdomain Enumeration</option>
                            <option value="email">Email Discovery & Verification</option>
                            <option value="social">Social Media Intelligence</option>
                            <option value="github">GitHub/GitLab Repository Analysis</option>
                            <option value="employees">Employee Information Gathering</option>
                            <option value="leaks">Leaked Credentials Search</option>
                            <option value="infrastructure">Infrastructure Footprint Analysis</option>
                            <option value="dns">DNS Enumeration & WHOIS</option>
                            <option value="certificates">Certificate Transparency Logs</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Custom Requirements (Optional)</label>
                        <TextareaAutosize
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setCustomRequirements(event.target.value)}
                            placeholder="Example:&#10;- Focus on finding API keys in GitHub repositories&#10;- Look for subdomains related to staging and dev environments&#10;- Find email addresses of security team members&#10;&#10;Or provide specific OSINT research requirements..."
                            value={customRequirements}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting || !target.trim()}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                'Start Research'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const OSINTHunterInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    // Filter flows that are OSINT-related
    const osintFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            return (
                title.includes('osint') ||
                title.includes('subdomain') ||
                title.includes('email discovery') ||
                title.includes('social media') ||
                title.includes('github') ||
                title.includes('employee') ||
                title.includes('leak') ||
                title.includes('dns enumeration') ||
                title.includes('certificate transparency')
            );
        });
    }, [flows]);

    const stats = useMemo(() => {
        const total = osintFlows.length;
        const active = osintFlows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = osintFlows.filter((f) => f.status === 'finished').length;
        const findings = osintFlows.filter((f) => {
            const title = (f.title || '').toLowerCase();
            return title.includes('found') || title.includes('discovered') || title.includes('identified');
        }).length;
        return { total, active, completed, findings };
    }, [osintFlows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Research Projects</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 transition-transform group-hover:scale-110">
                            <Map className="size-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                        <p className="mt-1 text-xs text-muted-foreground">OSINT research flows</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-emerald-950/10 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Active</CardTitle>
                        <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                            <Workflow className="size-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Researching now</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-sky-950/10 transition-all duration-300 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Completed</CardTitle>
                        <div className="rounded-lg bg-sky-500/10 p-2 transition-transform group-hover:scale-110">
                            <Map className="size-4 text-sky-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-sky-400">{stats.completed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Research completed</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-purple-950/10 transition-all duration-300 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Findings</CardTitle>
                        <div className="rounded-lg bg-purple-500/10 p-2 transition-transform group-hover:scale-110">
                            <ShieldAlert className="size-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-purple-400">{stats.findings}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Intelligence gathered</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Map className="size-4 text-primary" />
                            </div>
                            <span>OSINT Research Projects</span>
                        </span>
                        <OSINTResearchForm />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>Research Project / Flow</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Findings</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading OSINT research projects…</p>
                        </div>
                    ) : !osintFlows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Map className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No OSINT research projects yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Start a new OSINT research project using "Start OSINT Research" above
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {osintFlows.map((flow) => {
                                const title = flow.title || '';
                                const researchType = title.toLowerCase().includes('subdomain')
                                    ? 'Domain'
                                    : title.toLowerCase().includes('email')
                                    ? 'Email'
                                    : title.toLowerCase().includes('social')
                                    ? 'Social'
                                    : title.toLowerCase().includes('github')
                                    ? 'GitHub'
                                    : title.toLowerCase().includes('employee')
                                    ? 'Employee'
                                    : title.toLowerCase().includes('leak')
                                    ? 'Leaks'
                                    : title.toLowerCase().includes('dns')
                                    ? 'DNS'
                                    : title.toLowerCase().includes('certificate')
                                    ? 'Certs'
                                    : 'OSINT';

                                return (
                                    <button
                                        className="group grid w-full grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm"
                                        key={flow.id}
                                        onClick={() =>
                                            workspaceId &&
                                            navigate(
                                                `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                            )
                                        }
                                        type="button"
                                    >
                                        <span className="truncate font-semibold text-foreground">
                                            {title || `OSINT Research ${String(flow.id || '').slice(0, 8)}`}
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs capitalize font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs font-medium"
                                                variant="outline"
                                            >
                                                {researchType}
                                            </Badge>
                                        </span>
                                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {flow.status === 'failed'
                                                ? 'OSINT research failed – check logs for details.'
                                                : flow.status === 'finished'
                                                ? 'OSINT research completed. View findings and intelligence gathered in AI Attack Flow.'
                                                : 'Gathering OSINT intelligence...'}
                                        </span>
                                        <span className="flex items-center justify-end gap-2">
                                            {flow.status === 'running' || flow.status === 'waiting' ? (
                                                <Button
                                                    onClick={async (event) => {
                                                        event.stopPropagation();
                                                        await finishFlow(flow as any);
                                                    }}
                                                    size="xs"
                                                    variant="outline"
                                                >
                                                    Stop
                                                </Button>
                                            ) : null}
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    workspaceId &&
                                                        navigate(
                                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                        );
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const OSINTHunterSection = () => (
    <FlowsProvider>
        <OSINTHunterInner />
    </FlowsProvider>
);

const QuickGenerateReportButton = ({
    flowId,
    flowTitle,
}: {
    flowId: string;
    flowTitle: string;
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow } = useFlows();
    const { providers, selectedProvider } = useProviders();

    const handleQuickGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const message = `Generate a comprehensive security assessment report based on flow "${flowTitle}" (Flow ID: ${flowId}). Include executive summary, detailed technical findings, risk ratings, proof-of-concept exploits, and remediation guidance. Format the report professionally with clear sections, tables, and code blocks.`;

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Report generation started', {
                    description: `Generating report from ${flowTitle}`,
                });
            }
        } catch (error) {
            toast.error('Failed to generate report', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            className="gap-2"
            disabled={isGenerating}
            onClick={handleQuickGenerate}
            size="xs"
            variant="outline"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="size-3 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <FileText className="size-3" />
                    Generate Report
                </>
            )}
        </Button>
    );
};

const ReportGenerateForm = () => {
    const [open, setOpen] = useState(false);
    const [reportType, setReportType] = useState<string>('executive');
    const [targetFlowId, setTargetFlowId] = useState('');
    const [customRequirements, setCustomRequirements] = useState('');
    const [includePoCs, setIncludePoCs] = useState(true);
    const [includeRemediation, setIncludeRemediation] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { createFlow, flows } = useFlows();
    const { providers, selectedProvider } = useProviders();

    // Get completed flows for selection
    const completedFlows = useMemo(() => {
        return flows.filter((f) => f.status === 'finished');
    }, [flows]);

    const handleSubmit = async () => {
        if (!targetFlowId && !customRequirements.trim()) {
            toast.error('Please select a flow or provide custom requirements');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const providerName = selectedProvider?.name || providers[0]?.name || '';

            const reportTypeMap: Record<string, string> = {
                executive: 'Executive Summary Report',
                technical: 'Technical Detailed Report',
                compliance: 'Compliance & Risk Assessment Report',
                remediation: 'Remediation Guide Report',
                findings: 'Vulnerability Findings Report',
                comprehensive: 'Comprehensive Security Assessment Report',
            };

            const selectedFlow = flows.find((f) => String(f.id) === targetFlowId);
            const flowContext = selectedFlow
                ? `Analyze flow "${selectedFlow.title || `Flow ${selectedFlow.id}`}" (Flow ID: ${selectedFlow.id}) and generate a report based on all findings, tasks, and results from this flow.`
                : '';

            const message = [
                'You are a specialized Security Report Generator for penetration testing and vulnerability assessments.',
                `Generate a ${reportTypeMap[reportType]} based on the provided security assessment data.`,
                flowContext,
                customRequirements.trim()
                    ? `Custom report requirements:\n${customRequirements.trim()}`
                    : '',
                `Report type: ${reportTypeMap[reportType]}.`,
                includePoCs ? 'Include proof-of-concept exploits and code snippets where applicable.' : '',
                includeRemediation ? 'Include detailed remediation guidance and recommendations.' : '',
                'Report should include:',
                reportType === 'executive'
                    ? [
                          '- Executive summary with key findings',
                          '- Risk rating and business impact assessment',
                          '- High-level vulnerability overview',
                          '- Strategic recommendations',
                          '- Compliance implications',
                      ]
                    : reportType === 'technical'
                    ? [
                          '- Detailed technical findings',
                          '- Vulnerability descriptions with CVSS scores',
                          '- Proof-of-concept exploits',
                          '- Technical remediation steps',
                          '- Affected components and versions',
                          '- Exploitation steps and evidence',
                      ]
                    : reportType === 'compliance'
                    ? [
                          '- Compliance mapping (OWASP Top 10, CWE, etc.)',
                          '- Risk ratings and impact assessment',
                          '- Regulatory compliance gaps',
                          '- Remediation priorities',
                          '- Compliance recommendations',
                      ]
                    : reportType === 'remediation'
                    ? [
                          '- Detailed remediation steps for each vulnerability',
                          '- Code fixes and configuration changes',
                          '- Priority-based remediation roadmap',
                          '- Testing and verification steps',
                          '- Prevention strategies',
                      ]
                    : reportType === 'findings'
                    ? [
                          '- Comprehensive vulnerability listing',
                          '- Severity classification',
                          '- Affected endpoints and parameters',
                          '- Proof-of-concept payloads',
                          '- Impact assessment',
                      ]
                    : [
                          '- Executive summary',
                          '- Detailed technical findings',
                          '- Risk assessment',
                          '- Compliance mapping',
                          '- Remediation guidance',
                          '- Proof-of-concept exploits',
                          '- Strategic recommendations',
                      ],
                'Format the report professionally with:',
                '- Clear sections and subsections',
                '- Tables for vulnerability listings',
                '- Code blocks for exploits and payloads',
                '- Risk ratings and severity indicators',
                '- Visual hierarchy and formatting',
                'Make the report production-ready and suitable for stakeholders.',
            ]
                .filter(Boolean)
                .flat()
                .join('\n');

            const id = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (id && workspaceId) {
                // Associate flow with current workspace
                addFlowToWorkspace(workspaceId, String(id));
                
                toast.success('Report generation started', {
                    description:
                        providerName && providers.length
                            ? `${reportTypeMap[reportType]} • ${getProviderDisplayName({
                                  name: providerName,
                                  type: providers[0]?.type ?? ProviderType.Anthropic,
                              })}`
                            : reportTypeMap[reportType],
                });
                setTargetFlowId('');
                setReportType('executive');
                setCustomRequirements('');
                setIncludePoCs(true);
                setIncludeRemediation(true);
                setOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            onOpenChange={setOpen}
            open={open}
        >
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                >
                    <Plus className="size-4" />
                    Generate Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="border-b border-muted/50 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <FileText className="size-4 text-primary" />
                        </div>
                        Generate Security Report
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Report Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setReportType(event.target.value)}
                            value={reportType}
                        >
                            <option value="executive">Executive Summary Report</option>
                            <option value="technical">Technical Detailed Report</option>
                            <option value="compliance">Compliance & Risk Assessment</option>
                            <option value="remediation">Remediation Guide Report</option>
                            <option value="findings">Vulnerability Findings Report</option>
                            <option value="comprehensive">Comprehensive Security Assessment</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Source Flow (Optional)</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setTargetFlowId(event.target.value)}
                            value={targetFlowId}
                        >
                            <option value="">Select a completed flow...</option>
                            {completedFlows.map((flow) => (
                                <option
                                    key={flow.id}
                                    value={String(flow.id)}
                                >
                                    {flow.title || `Flow ${flow.id}`} ({flow.status})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Select a completed flow to generate report from its findings
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Custom Requirements (Optional)</label>
                        <TextareaAutosize
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) => setCustomRequirements(event.target.value)}
                            placeholder="Example:&#10;- Focus on SQL injection and XSS vulnerabilities&#10;- Include compliance mapping to OWASP Top 10&#10;- Add risk ratings for each finding&#10;- Include executive summary for management&#10;&#10;Or provide specific report requirements..."
                            value={customRequirements}
                        />
                    </div>

                    <div className="space-y-3 rounded-lg border border-muted/50 bg-muted/20 p-4">
                        <div className="text-sm font-semibold">Report Options</div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    checked={includePoCs}
                                    className="rounded border-input"
                                    onChange={(event) => setIncludePoCs(event.target.checked)}
                                    type="checkbox"
                                />
                                <span className="text-sm">Include Proof-of-Concept Exploits</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    checked={includeRemediation}
                                    className="rounded border-input"
                                    onChange={(event) => setIncludeRemediation(event.target.checked)}
                                    type="checkbox"
                                />
                                <span className="text-sm">Include Remediation Guidance</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting || (!targetFlowId && !customRequirements.trim())}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Report'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ReportGeneratorInner = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { flows: allFlows, isLoading, finishFlow } = useFlows();

    // Filter flows for current workspace
    const flows = useMemo(() => {
        return getWorkspaceFlows(workspaceId, allFlows);
    }, [workspaceId, allFlows]);

    // Filter flows that are report-related
    const reportFlows = useMemo(() => {
        return flows.filter((flow) => {
            const title = (flow.title || '').toLowerCase();
            return (
                title.includes('report') ||
                title.includes('executive') ||
                title.includes('technical report') ||
                title.includes('compliance') ||
                title.includes('remediation') ||
                title.includes('findings report') ||
                title.includes('security assessment')
            );
        });
    }, [flows]);

    // Get completed flows that can be used to generate reports
    const completedFlows = useMemo(() => {
        return flows.filter((flow) => {
            const isCompleted = flow.status === 'finished';
            const isNotReport = !reportFlows.some((rf) => rf.id === flow.id);
            return isCompleted && isNotReport;
        });
    }, [flows, reportFlows]);

    const stats = useMemo(() => {
        const total = reportFlows.length;
        const active = reportFlows.filter((f) => f.status === 'running' || f.status === 'waiting').length;
        const completed = reportFlows.filter((f) => f.status === 'finished').length;
        const executive = reportFlows.filter((f) => {
            const title = (f.title || '').toLowerCase();
            return title.includes('executive') || title.includes('summary');
        }).length;
        return { total, active, completed, executive };
    }, [reportFlows]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Total Reports</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 transition-transform group-hover:scale-110">
                            <FileText className="size-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Reports generated</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-emerald-950/10 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Active</CardTitle>
                        <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
                            <Workflow className="size-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Generating now</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-sky-950/10 transition-all duration-300 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Completed</CardTitle>
                        <div className="rounded-lg bg-sky-500/10 p-2 transition-transform group-hover:scale-110">
                            <FileText className="size-4 text-sky-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-sky-400">{stats.completed}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Ready to use</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-background to-purple-950/10 transition-all duration-300 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">Executive</CardTitle>
                        <div className="rounded-lg bg-purple-500/10 p-2 transition-transform group-hover:scale-110">
                            <FileText className="size-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold tracking-tight text-purple-400">{stats.executive}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Executive reports</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Generate from Completed Flows */}
            {completedFlows.length > 0 && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                                    <FileText className="size-4 text-emerald-400" />
                                </div>
                                <span>Quick Generate from Completed Flows</span>
                            </span>
                            <Badge
                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                variant="outline"
                            >
                                {completedFlows.length} available
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {completedFlows.slice(0, 5).map((flow) => {
                                const flowTitle = flow.title || `Flow ${String(flow.id || '').slice(0, 8)}`;

                                return (
                                    <div
                                        className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/20"
                                        key={flow.id}
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex size-5 items-center justify-center rounded border-2 border-muted bg-background transition-colors group-hover:border-primary/50">
                                                <div className="size-2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-foreground">{flowTitle}</div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Flow ID: {String(flow.id || '').slice(0, 12)}</span>
                                                    <span>•</span>
                                                    <span>Status: {flow.status}</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-400">Ready for report generation</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                className="gap-2"
                                                onClick={() =>
                                                    workspaceId &&
                                                    navigate(
                                                        `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                    )
                                                }
                                                size="xs"
                                                variant="ghost"
                                            >
                                                View Flow
                                            </Button>
                                            <QuickGenerateReportButton
                                                flowId={String(flow.id || '')}
                                                flowTitle={flowTitle}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <FileText className="size-4 text-primary" />
                            </div>
                            <span>Generated Reports</span>
                        </span>
                        <ReportGenerateForm />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-muted/50 bg-muted/10">
                        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <span>Report / Flow</span>
                            <span>Status</span>
                            <span>Type</span>
                            <span>Details</span>
                            <span className="text-right">Actions</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading reports…</p>
                        </div>
                    ) : !reportFlows.length ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No reports generated yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Generate a report using "Generate Report" above
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {reportFlows.map((flow) => {
                                const title = flow.title || '';
                                const reportType = title.toLowerCase().includes('executive')
                                    ? 'Executive'
                                    : title.toLowerCase().includes('technical')
                                    ? 'Technical'
                                    : title.toLowerCase().includes('compliance')
                                    ? 'Compliance'
                                    : title.toLowerCase().includes('remediation')
                                    ? 'Remediation'
                                    : title.toLowerCase().includes('findings')
                                    ? 'Findings'
                                    : 'Report';

                                return (
                                    <button
                                        className="group grid w-full grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-6 py-4 text-left text-sm transition-all hover:bg-muted/30 hover:shadow-sm"
                                        key={flow.id}
                                        onClick={() =>
                                            workspaceId &&
                                            navigate(
                                                `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                            )
                                        }
                                        type="button"
                                    >
                                        <span className="truncate font-semibold text-foreground">
                                            {title || `Report ${String(flow.id || '').slice(0, 8)}`}
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs capitalize font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                        </span>
                                        <span>
                                            <Badge
                                                className="text-xs font-medium"
                                                variant="outline"
                                            >
                                                {reportType}
                                            </Badge>
                                        </span>
                                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {flow.status === 'failed'
                                                ? 'Report generation failed – check logs for details.'
                                                : flow.status === 'finished'
                                                ? 'Report ready. View in AI Attack Flow to see the complete report.'
                                                : 'Generating report...'}
                                        </span>
                                        <span className="flex items-center justify-end gap-2">
                                            {flow.status === 'running' || flow.status === 'waiting' ? (
                                                <Button
                                                    onClick={async (event) => {
                                                        event.stopPropagation();
                                                        await finishFlow(flow as any);
                                                    }}
                                                    size="xs"
                                                    variant="outline"
                                                >
                                                    Stop
                                                </Button>
                                            ) : null}
                                            <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    workspaceId &&
                                                        navigate(
                                                            `/dashboard/workspaces/${workspaceId}/ai-attack-flow?flowId=${flow.id}`,
                                                        );
                                                }}
                                                size="xs"
                                                variant="outline"
                                            >
                                                View
                                            </Button>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export const ReportGeneratorSection = () => (
    <FlowsProvider>
        <ReportGeneratorInner />
    </FlowsProvider>
);


// Utility functions for encoding/decoding
const base64Encode = (text: string) => btoa(unescape(encodeURIComponent(text)));
const base64Decode = (text: string) => {
    try {
        return decodeURIComponent(escape(atob(text)));
    } catch {
        return 'Invalid Base64';
    }
};

const urlEncode = (text: string) => encodeURIComponent(text);
const urlDecode = (text: string) => {
    try {
        return decodeURIComponent(text);
    } catch {
        return 'Invalid URL encoding';
    }
};

const ToolboxInner = () => {
    const [activeTool, setActiveTool] = useState<string>('hash');
    const [hashInput, setHashInput] = useState('');
    const [hashType, setHashType] = useState('md5');
    const [hashResult, setHashResult] = useState('');
    const [jwtToken, setJwtToken] = useState('');
    const [jwtResult, setJwtResult] = useState<any>(null);
    const [base64Input, setBase64Input] = useState('');
    const [base64Result, setBase64Result] = useState('');
    const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');
    const [urlInput, setUrlInput] = useState('');
    const [urlResult, setUrlResult] = useState('');
    const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');
    const [hexInput, setHexInput] = useState('');
    const [hexResult, setHexResult] = useState('');
    const [hexMode, setHexMode] = useState<'encode' | 'decode'>('encode');
    const [copied, setCopied] = useState<string | null>(null);

    const tools = [
        { id: 'hash', label: 'Hash Generator', icon: Hash },
        { id: 'jwt', label: 'JWT Decoder', icon: Key },
        { id: 'base64', label: 'Base64', icon: Code },
        { id: 'url', label: 'URL Encoder', icon: Link },
        { id: 'hex', label: 'Hex Converter', icon: Code },
        { id: 'uuid', label: 'UUID Generator', icon: Shield },
        { id: 'timestamp', label: 'Timestamp', icon: Clock },
        { id: 'password', label: 'Password Gen', icon: Zap },
    ];

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Hash Generator
    const generateHash = async () => {
        if (!hashInput.trim()) return;
        const encoder = new TextEncoder();
        const data = encoder.encode(hashInput);
        let hash: string;

        if (hashType === 'md5') {
            const hashBuffer = await crypto.subtle.digest('MD5', data);
            hash = Array.from(new Uint8Array(hashBuffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        } else {
            const hashBuffer = await crypto.subtle.digest(hashType.toUpperCase() as AlgorithmIdentifier, data);
            hash = Array.from(new Uint8Array(hashBuffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        }
        setHashResult(hash);
    };

    // JWT Decoder
    const decodeJWT = () => {
        if (!jwtToken.trim()) return;
        try {
            const parts = jwtToken.split('.');
            if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
                setJwtResult({ error: 'Invalid JWT format' });
                return;
            }
            const headerPart = parts[0] || '';
            const payloadPart = parts[1] || '';
            const headerDecoded = base64Decode(headerPart);
            const payloadDecoded = base64Decode(payloadPart);
            if (headerDecoded === 'Invalid Base64' || payloadDecoded === 'Invalid Base64') {
                setJwtResult({ error: 'Failed to decode JWT parts' });
                return;
            }
            const header = JSON.parse(headerDecoded);
            const payload = JSON.parse(payloadDecoded);
            setJwtResult({ header, payload, signature: parts[2] });
        } catch (error) {
            setJwtResult({ error: 'Failed to decode JWT' });
        }
    };

    // Base64
    const handleBase64 = () => {
        if (!base64Input.trim()) return;
        if (base64Mode === 'encode') {
            setBase64Result(base64Encode(base64Input));
        } else {
            setBase64Result(base64Decode(base64Input));
        }
    };

    // URL
    const handleUrl = () => {
        if (!urlInput.trim()) return;
        if (urlMode === 'encode') {
            setUrlResult(urlEncode(urlInput));
        } else {
            setUrlResult(urlDecode(urlInput));
        }
    };

    // Hex
    const handleHex = () => {
        if (!hexInput.trim()) return;
        if (hexMode === 'encode') {
            setHexResult(
                Array.from(new TextEncoder().encode(hexInput))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join(''),
            );
        } else {
            try {
                const bytes = hexInput.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [];
                setHexResult(new TextDecoder().decode(new Uint8Array(bytes)));
            } catch {
                setHexResult('Invalid hex string');
            }
        }
    };

    // UUID Generator
    const generateUUID = () => {
        return crypto.randomUUID();
    };

    // Timestamp Converter
    const getCurrentTimestamp = () => {
        return Math.floor(Date.now() / 1000);
    };

    // Password Generator
    const generatePassword = (length: number = 16, includeSpecial: boolean = true) => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let chars = lowercase + uppercase + numbers;
        if (includeSpecial) chars += special;
        return Array.from(crypto.getRandomValues(new Uint32Array(length)))
            .map((x) => chars[x % chars.length])
            .join('');
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-1">
            {/* Tool Selection */}
            <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                <CardHeader className="border-b border-muted/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <TerminalSquare className="size-4 text-primary" />
                        </div>
                        <span>Cybersecurity Toolbox</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-4 gap-2 p-4">
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                                        activeTool === tool.id
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                    key={tool.id}
                                    onClick={() => setActiveTool(tool.id)}
                                    type="button"
                                >
                                    <Icon className="size-5" />
                                    <span className="text-xs font-medium">{tool.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Hash Generator */}
            {activeTool === 'hash' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Hash className="size-4 text-primary" />
                            <span>Hash Generator</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Hash Type</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(event) => setHashType(event.target.value)}
                                value={hashType}
                            >
                                <option value="md5">MD5</option>
                                <option value="sha1">SHA-1</option>
                                <option value="sha256">SHA-256</option>
                                <option value="sha512">SHA-512</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Input Text</label>
                            <TextareaAutosize
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                onChange={(event) => setHashInput(event.target.value)}
                                placeholder="Enter text to hash..."
                                value={hashInput}
                            />
                        </div>
                        <Button
                            onClick={generateHash}
                            size="sm"
                        >
                            Generate Hash
                        </Button>
                        {hashResult && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Hash Result</label>
                                    <Button
                                        onClick={() => handleCopy(hashResult, 'hash')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'hash' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm">
                                    {hashResult}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* JWT Decoder */}
            {activeTool === 'jwt' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Key className="size-4 text-primary" />
                            <span>JWT Decoder</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">JWT Token</label>
                            <TextareaAutosize
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                onChange={(event) => setJwtToken(event.target.value)}
                                placeholder="Paste JWT token here..."
                                value={jwtToken}
                            />
                        </div>
                        <Button
                            onClick={decodeJWT}
                            size="sm"
                        >
                            Decode JWT
                        </Button>
                        {jwtResult && (
                            <div className="space-y-4">
                                {jwtResult.error ? (
                                    <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                                        {jwtResult.error}
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold">Header</label>
                                                <Button
                                                    onClick={() => handleCopy(JSON.stringify(jwtResult.header, null, 2), 'jwt-header')}
                                                    size="xs"
                                                    variant="ghost"
                                                >
                                                    {copied === 'jwt-header' ? (
                                                        <Check className="size-3" />
                                                    ) : (
                                                        <Copy className="size-3" />
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-xs">
                                                <pre>{JSON.stringify(jwtResult.header, null, 2)}</pre>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold">Payload</label>
                                                <Button
                                                    onClick={() => handleCopy(JSON.stringify(jwtResult.payload, null, 2), 'jwt-payload')}
                                                    size="xs"
                                                    variant="ghost"
                                                >
                                                    {copied === 'jwt-payload' ? (
                                                        <Check className="size-3" />
                                                    ) : (
                                                        <Copy className="size-3" />
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-xs">
                                                <pre>{JSON.stringify(jwtResult.payload, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Base64 Encoder/Decoder */}
            {activeTool === 'base64' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Code className="size-4 text-primary" />
                            <span>Base64 Encoder/Decoder</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex gap-2">
                            <Button
                                className={base64Mode === 'encode' ? '' : 'opacity-50'}
                                onClick={() => setBase64Mode('encode')}
                                size="sm"
                                variant={base64Mode === 'encode' ? 'default' : 'outline'}
                            >
                                Encode
                            </Button>
                            <Button
                                className={base64Mode === 'decode' ? '' : 'opacity-50'}
                                onClick={() => setBase64Mode('decode')}
                                size="sm"
                                variant={base64Mode === 'decode' ? 'default' : 'outline'}
                            >
                                Decode
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Input</label>
                            <TextareaAutosize
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                onChange={(event) => setBase64Input(event.target.value)}
                                placeholder={base64Mode === 'encode' ? 'Enter text to encode...' : 'Enter base64 to decode...'}
                                value={base64Input}
                            />
                        </div>
                        <Button
                            onClick={handleBase64}
                            size="sm"
                        >
                            {base64Mode === 'encode' ? 'Encode' : 'Decode'}
                        </Button>
                        {base64Result && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Result</label>
                                    <Button
                                        onClick={() => handleCopy(base64Result, 'base64')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'base64' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm break-all">
                                    {base64Result}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* URL Encoder/Decoder */}
            {activeTool === 'url' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Link className="size-4 text-primary" />
                            <span>URL Encoder/Decoder</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex gap-2">
                            <Button
                                className={urlMode === 'encode' ? '' : 'opacity-50'}
                                onClick={() => setUrlMode('encode')}
                                size="sm"
                                variant={urlMode === 'encode' ? 'default' : 'outline'}
                            >
                                Encode
                            </Button>
                            <Button
                                className={urlMode === 'decode' ? '' : 'opacity-50'}
                                onClick={() => setUrlMode('decode')}
                                size="sm"
                                variant={urlMode === 'decode' ? 'default' : 'outline'}
                            >
                                Decode
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Input</label>
                            <TextareaAutosize
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                onChange={(event) => setUrlInput(event.target.value)}
                                placeholder={urlMode === 'encode' ? 'Enter text to URL encode...' : 'Enter URL encoded text...'}
                                value={urlInput}
                            />
                        </div>
                        <Button
                            onClick={handleUrl}
                            size="sm"
                        >
                            {urlMode === 'encode' ? 'Encode' : 'Decode'}
                        </Button>
                        {urlResult && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Result</label>
                                    <Button
                                        onClick={() => handleCopy(urlResult, 'url')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'url' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm break-all">
                                    {urlResult}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Hex Converter */}
            {activeTool === 'hex' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Code className="size-4 text-primary" />
                            <span>Hex Converter</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex gap-2">
                            <Button
                                className={hexMode === 'encode' ? '' : 'opacity-50'}
                                onClick={() => setHexMode('encode')}
                                size="sm"
                                variant={hexMode === 'encode' ? 'default' : 'outline'}
                            >
                                Text to Hex
                            </Button>
                            <Button
                                className={hexMode === 'decode' ? '' : 'opacity-50'}
                                onClick={() => setHexMode('decode')}
                                size="sm"
                                variant={hexMode === 'decode' ? 'default' : 'outline'}
                            >
                                Hex to Text
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Input</label>
                            <TextareaAutosize
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                onChange={(event) => setHexInput(event.target.value)}
                                placeholder={hexMode === 'encode' ? 'Enter text to convert to hex...' : 'Enter hex string...'}
                                value={hexInput}
                            />
                        </div>
                        <Button
                            onClick={handleHex}
                            size="sm"
                        >
                            Convert
                        </Button>
                        {hexResult && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Result</label>
                                    <Button
                                        onClick={() => handleCopy(hexResult, 'hex')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'hex' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm break-all">
                                    {hexResult}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* UUID Generator */}
            {activeTool === 'uuid' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Shield className="size-4 text-primary" />
                            <span>UUID Generator</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <Button
                            onClick={() => {
                                const uuid = generateUUID();
                                handleCopy(uuid, 'uuid');
                                setHexResult(uuid);
                            }}
                            size="sm"
                        >
                            Generate UUID
                        </Button>
                        {hexResult && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Generated UUID</label>
                                    <Button
                                        onClick={() => handleCopy(hexResult, 'uuid')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'uuid' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm">
                                    {hexResult}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Timestamp Converter */}
            {activeTool === 'timestamp' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Clock className="size-4 text-primary" />
                            <span>Timestamp Converter</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="rounded-md border border-muted bg-muted/30 p-4">
                            <div className="text-sm font-semibold mb-2">Current Timestamp</div>
                            <div className="font-mono text-lg">{getCurrentTimestamp()}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {new Date(getCurrentTimestamp() * 1000).toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Password Generator */}
            {activeTool === 'password' && (
                <Card className="overflow-hidden border-muted/50 bg-gradient-to-br from-background to-muted/10 shadow-sm">
                    <CardHeader className="border-b border-muted/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2.5">
                            <Zap className="size-4 text-primary" />
                            <span>Password Generator</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <Button
                            onClick={() => {
                                const password = generatePassword(16, true);
                                handleCopy(password, 'password');
                                setHexResult(password);
                            }}
                            size="sm"
                        >
                            Generate Password
                        </Button>
                        {hexResult && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Generated Password</label>
                                    <Button
                                        onClick={() => handleCopy(hexResult, 'password')}
                                        size="xs"
                                        variant="ghost"
                                    >
                                        {copied === 'password' ? (
                                            <Check className="size-3" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-md border border-muted bg-muted/30 p-3 font-mono text-sm">
                                    {hexResult}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export const ToolboxSection = () => <ToolboxInner />;

