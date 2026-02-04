import type { Dispatch, SetStateAction } from 'react';

import { useEffect, useRef } from 'react';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FlowAgents from '@/features/flows/agents/flow-agents';
import FlowAssistantMessages from '@/features/flows/messages/flow-assistant-messages';
import FlowAutomationMessages from '@/features/flows/messages/flow-automation-messages';
import FlowScreenshots from '@/features/flows/screenshots/flow-screenshots';
import FlowTasks from '@/features/flows/tasks/flow-tasks';
import FlowTerminal from '@/features/flows/terminal/flow-terminal';
import FlowTools from '@/features/flows/tools/flow-tools';
import FlowVectorStores from '@/features/flows/vector-stores/flow-vector-stores';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface FlowTabsProps {
    activeTab: string;
    onTabChange: Dispatch<SetStateAction<string>>;
}

const FlowTabs = ({ activeTab, onTabChange }: FlowTabsProps) => {
    const { isDesktop } = useBreakpoint();

    const previousActiveTabRef = useRef<string>(activeTab);

    useEffect(() => {
        // Only handle actual tab changes
        if (activeTab === previousActiveTabRef.current) {
            return;
        }

        previousActiveTabRef.current = activeTab;
    }, [activeTab]);

    return (
        <Tabs
            className="flex size-full flex-col"
            onValueChange={onTabChange}
            value={activeTab}
        >
            <div className="max-w-full">
                <ScrollArea className="w-full pb-3">
                    <TabsList className="flex w-fit gap-1 bg-muted/30 p-1">
                        {!isDesktop && (
                            <TabsTrigger
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                                value="automation"
                            >
                                Automation
                            </TabsTrigger>
                        )}
                        {!isDesktop && (
                            <TabsTrigger
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                                value="assistant"
                            >
                                Assistant
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="terminal"
                        >
                            Terminal
                        </TabsTrigger>
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="tasks"
                        >
                            Tasks
                        </TabsTrigger>
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="agents"
                        >
                            Agents
                        </TabsTrigger>
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="tools"
                        >
                            Searches
                        </TabsTrigger>
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="vectorStores"
                        >
                            Vector Store
                        </TabsTrigger>
                        <TabsTrigger
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                            value="screenshots"
                        >
                            Screenshots
                        </TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* Mobile Tabs only */}
            {!isDesktop && (
                <TabsContent
                    className="mt-4 flex-1 overflow-auto"
                    value="automation"
                >
                    <FlowAutomationMessages className="pr-4" />
                </TabsContent>
            )}
            {!isDesktop && (
                <TabsContent
                    className="mt-4 flex-1 overflow-auto"
                    value="assistant"
                >
                    <FlowAssistantMessages className="pr-4" />
                </TabsContent>
            )}

            {/* Desktop and Mobile Tabs */}
            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="terminal"
            >
                <FlowTerminal />
            </TabsContent>

            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="tasks"
            >
                <FlowTasks />
            </TabsContent>

            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="agents"
            >
                <FlowAgents />
            </TabsContent>

            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="tools"
            >
                <FlowTools />
            </TabsContent>

            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="vectorStores"
            >
                <FlowVectorStores />
            </TabsContent>

            <TabsContent
                className="mt-4 flex-1 overflow-auto"
                value="screenshots"
            >
                <FlowScreenshots />
            </TabsContent>
        </Tabs>
    );
};

export default FlowTabs;

