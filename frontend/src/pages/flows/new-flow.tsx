import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlowForm, type FlowFormValues } from '@/features/flows/flow-form';
import { useFlows } from '@/providers/flows-provider';
import { useProviders } from '@/providers/providers-provider';
import { useSystemSettings } from '@/providers/system-settings-provider';

const NewFlow = () => {
    const navigate = useNavigate();

    const { selectedProvider } = useProviders();
    const { createFlow, createFlowWithAssistant } = useFlows();
    const { settings } = useSystemSettings();

    const [isLoading, setIsLoading] = useState(false);
    const [flowType, setFlowType] = useState<'assistant' | 'automation'>('automation');

    // Calculate default useAgents value (only for assistant type)
    const shouldUseAgents = useMemo(() => {
        return settings?.assistantUseAgents ?? false;
    }, [settings?.assistantUseAgents]);

    const handleSubmit = async (values: FlowFormValues) => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            const flowId = flowType === 'automation' ? await createFlow(values) : await createFlowWithAssistant(values);

            if (flowId) {
                // Navigate to the new flow page with tab parameter
                navigate(`/flows/${flowId}?tab=${flowType}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const [domain, setDomain] = useState('');
    const [includeSubdomains, setIncludeSubdomains] = useState(true);

    const handleReconSubmit = async () => {
        if (isLoading) return;

        const trimmedDomain = domain.trim();
        const providerName = selectedProvider?.name ?? '';

        if (!trimmedDomain || !providerName) {
            return;
        }

        setIsLoading(true);

        const message = [
            `You are an offensive security recon agent.`,
            `Target domain: ${trimmedDomain}.`,
            includeSubdomains
                ? 'Include subdomains and related assets in scope.'
                : 'Focus only on the main domain (no subdomains).',
            'Plan and execute a full recon workflow (DNS, subdomains, ports, tech stack fingerprinting, screenshots, interesting endpoints, potential attack surface).',
            'Output next steps clearly so exploitation flows can be built on top of these findings.',
        ].join(' ');

        try {
            const flowId = await createFlow({
                message,
                providerName,
                useAgents: false,
            });

            if (flowId) {
                navigate(`/flows/${flowId}?tab=automation`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    className="mr-2 h-4"
                    orientation="vertical"
                />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>New flow</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardContent className="flex flex-col gap-4 pt-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-semibold">Create a new flow</h1>
                            <p className="mt-2 text-muted-foreground">
                                Recon ke liye target set karo, exploitation ke liye instructions do – XIQ baaki handle
                                karega.
                            </p>
                        </div>
                        <Tabs
                            onValueChange={(value) => setFlowType(value as 'assistant' | 'automation')}
                            value={flowType}
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger
                                    disabled={isLoading}
                                    value="automation"
                                >
                                    Automation
                                </TabsTrigger>
                                <TabsTrigger
                                    disabled={isLoading}
                                    value="assistant"
                                >
                                    Assistant
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {flowType === 'automation' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target domain</label>
                                    <Input
                                        autoComplete="off"
                                        onChange={(event) => setDomain(event.target.value)}
                                        placeholder="example.com"
                                        value={domain}
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                        checked={includeSubdomains}
                                        className="size-3 rounded border border-border"
                                        onChange={(event) => setIncludeSubdomains(event.target.checked)}
                                        type="checkbox"
                                    />
                                    Include subdomains in scope
                                </label>
                                <Button
                                    className="w-full"
                                    disabled={isLoading || !domain.trim() || !selectedProvider?.name}
                                    onClick={handleReconSubmit}
                                >
                                    {isLoading ? 'Starting…' : 'Start Recon Flow'}
                                </Button>
                            </div>
                        ) : (
                            <FlowForm
                                defaultValues={{
                                    providerName: selectedProvider?.name ?? '',
                                    useAgents: shouldUseAgents,
                                }}
                                isSubmitting={isLoading}
                                onSubmit={handleSubmit}
                                placeholder={
                                    !isLoading
                                        ? 'What would you like me to help you with?'
                                        : 'Creating a new flow...'
                                }
                                type={flowType}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default NewFlow;
