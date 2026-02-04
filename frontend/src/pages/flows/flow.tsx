import { ChevronDown, Copy, Download, ExternalLink, GripVertical, Loader2, NotepadText, Workflow, Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FlowStatusIcon } from '@/components/icons/flow-status-icon';
import { ProviderIcon } from '@/components/icons/provider-icon';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import FlowCentralTabs from '@/features/flows/flow-central-tabs';
import FlowTabs from '@/features/flows/flow-tabs';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Log } from '@/lib/log';
import { copyToClipboard, downloadTextFile, generateFileName, generateReport } from '@/lib/report';
import { formatName } from '@/lib/utils/format';
import { useFlow } from '@/providers/flow-provider';

const FlowReportDropdown = () => {
    const { flowData, flowId } = useFlow();
    const flow = flowData?.flow;
    const tasks = flowData?.tasks ?? [];

    // Check if flow is available for report generation
    const isReportDisabled = !flow || !flowId;

    // Report export handlers
    const handleCopyToClipboard = async () => {
        if (isReportDisabled) {
            return;
        }

        const reportContent = generateReport(tasks, flow);
        const success = await copyToClipboard(reportContent);

        if (success) {
            toast.success('Report copied to clipboard');
        } else {
            Log.error('Failed to copy report to clipboard');
            toast.error('Failed to copy report to clipboard');
        }
    };

    const handleDownloadMD = () => {
        if (isReportDisabled || !flow) {
            return;
        }

        try {
            // Generate report content
            const reportContent = generateReport(tasks, flow);

            // Generate file name
            const baseFileName = generateFileName(flow);
            const fileName = `${baseFileName}.md`;

            // Download file
            downloadTextFile(reportContent, fileName, 'text/markdown; charset=UTF-8');
        } catch (error) {
            Log.error('Failed to download markdown report:', error);
        }
    };

    const handleDownloadPDF = () => {
        if (isReportDisabled || !flow || !flowId) {
            return;
        }

        // Open new tab (not popup) with report page and download flag
        const url = `/flows/${flowId}/report?download=true&silent=true`;
        window.open(url, '_blank');
    };

    const handleOpenWebView = () => {
        if (isReportDisabled || !flowId) {
            return;
        }

        // Open new tab with report page for web viewing
        const url = `/flows/${flowId}/report`;
        window.open(url, '_blank');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className="shrink-0"
                    disabled={isReportDisabled}
                    variant="ghost"
                >
                    <NotepadText />
                    Report
                    <ChevronDown className="opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    className="flex items-center gap-2"
                    disabled={isReportDisabled}
                    onClick={handleOpenWebView}
                >
                    <ExternalLink className="size-4" />
                    Open web view
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-2"
                    disabled={isReportDisabled}
                    onClick={handleCopyToClipboard}
                >
                    <Copy className="size-4" />
                    Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-2"
                    disabled={isReportDisabled}
                    onClick={handleDownloadMD}
                >
                    <Download className="size-4" />
                    Download MD
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="flex items-center gap-2"
                    disabled={isReportDisabled}
                    onClick={handleDownloadPDF}
                >
                    <Download className="size-4" />
                    Download PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const Flow = ({ embedded = false }: { embedded?: boolean }) => {
    const { isDesktop } = useBreakpoint();
    const navigate = useNavigate();

    // Get flow data from FlowProvider
    const { flowData, flowError, isLoading: isFlowLoading } = useFlow();

    // Redirect to flows list if there's an error loading flow data or flow not found.
    // For embedded usage we don't redirect, sirf empty state dikhate hain.
    useEffect(() => {
        if (embedded) {
            return;
        }
        if (flowError || (!isFlowLoading && !flowData?.flow)) {
            navigate('/flows', { replace: true });
        }
    }, [embedded, flowError, flowData, isFlowLoading, navigate]);

    // State for preserving active tabs when switching flows
    const [activeTabsTab, setActiveTabsTab] = useState<string>(!isDesktop ? 'automation' : 'terminal');

    const containerHeightClass = embedded ? 'h-full' : 'h-[calc(100dvh-3rem)]';

    const tabsCard = (
        <div className={`flex ${containerHeightClass} max-w-full flex-col rounded-none border-0`}>
            <div className="flex-1 overflow-auto py-4 pl-4 pr-0">
                <FlowTabs
                    activeTab={activeTabsTab}
                    onTabChange={setActiveTabsTab}
                />
            </div>
        </div>
    );

    const flow = flowData?.flow;
    const tasks = flowData?.tasks ?? [];
    const taskCount = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'finished').length;

    return (
        <>
            {!embedded && (
                <header className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b border-muted/50 bg-gradient-to-r from-background via-muted/30 to-background backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
                    <div className="flex w-full items-center justify-between gap-4 px-6">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                className="mr-1 h-6"
                                orientation="vertical"
                            />
                            {flow && (
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <FlowStatusIcon
                                            className="size-5"
                                            status={flow.status}
                                            tooltip={formatName(flow.status)}
                                        />
                                        <ProviderIcon
                                            className="size-5"
                                            provider={flow.provider}
                                            tooltip={formatName(flow.provider.name)}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Breadcrumb>
                                            <BreadcrumbList>
                                                <BreadcrumbItem className="gap-2">
                                                    <BreadcrumbPage className="text-sm font-semibold truncate">
                                                        {flow.title || `Flow ${flow.id}`}
                                                    </BreadcrumbPage>
                                                </BreadcrumbItem>
                                            </BreadcrumbList>
                                        </Breadcrumb>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge
                                                className="text-[10px] font-medium"
                                                variant={
                                                    flow.status === 'failed'
                                                        ? 'destructive'
                                                        : flow.status === 'finished'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {formatName(flow.status)}
                                            </Badge>
                                            {taskCount > 0 && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Workflow className="size-3" />
                                                    {completedTasks}/{taskCount} tasks
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!flow && (
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="text-sm font-semibold">Select a flow</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            )}
                        </div>
                        {!!taskCount && (
                            <div className="flex items-center gap-2 shrink-0">
                                <FlowReportDropdown />
                            </div>
                        )}
                    </div>
                </header>
            )}
            <div className={`relative flex ${containerHeightClass} w-full max-w-full flex-1 bg-gradient-to-br from-background via-muted/5 to-background`}>
                {isFlowLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="size-12 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">Loading flow details...</p>
                        </div>
                    </div>
                )}
                {isDesktop ? (
                    <ResizablePanelGroup
                        className="w-full"
                        direction="horizontal"
                    >
                        <ResizablePanel
                            defaultSize={50}
                            minSize={30}
                        >
                            <div className="flex h-[calc(100dvh-4rem)] max-w-full flex-col rounded-none border-0 bg-background">
                                <div className="border-b border-muted/50 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent px-6 py-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-primary/10 p-1.5">
                                            <User className="size-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-tight">Messages</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Automation & Assistant conversations</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto py-4 pl-6 pr-4">
                                    <FlowCentralTabs />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle className="bg-muted/50 hover:bg-primary/20 transition-colors">
                            <GripVertical className="size-4 text-muted-foreground" />
                        </ResizableHandle>
                        <ResizablePanel
                            defaultSize={50}
                            minSize={30}
                        >
                            <div className={`flex ${containerHeightClass} max-w-full flex-col rounded-none border-0 bg-background`}>
                                <div className="border-b border-muted/50 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent px-6 py-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-primary/10 p-1.5">
                                            <Workflow className="size-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-tight">Execution Details</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Tasks, Terminal, Agents & Tools</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto py-4 pl-6 pr-4">
                                    <FlowTabs
                                        activeTab={activeTabsTab}
                                        onTabChange={setActiveTabsTab}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className={`flex ${containerHeightClass} max-w-full flex-col rounded-none border-0 bg-background`}>
                        <div className="border-b border-muted/50 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent px-6 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-primary/10 p-1.5">
                                    <Workflow className="size-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold tracking-tight">Flow Execution</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Tasks, Terminal, Agents & Tools</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto py-4 pl-4 pr-4">
                            <FlowTabs
                                activeTab={activeTabsTab}
                                onTabChange={setActiveTabsTab}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Flow;
