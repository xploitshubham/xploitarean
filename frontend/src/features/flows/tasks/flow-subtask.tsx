import { ListCheck, ListTodo } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

import type { SubtaskFragmentFragment } from '@/graphql/types';

import Markdown from '@/components/shared/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import FlowTaskStatusIcon from './flow-task-status-icon';

interface FlowSubtaskProps {
    searchValue?: string;
    subtask: SubtaskFragmentFragment;
}

// Helper function to check if text contains search value (case-insensitive)
const containsSearchValue = (text: null | string | undefined, searchValue: string): boolean => {
    if (!text || !searchValue.trim()) {
        return false;
    }

    return text.toLowerCase().includes(searchValue.toLowerCase().trim());
};

const FlowSubtask = ({ searchValue = '', subtask }: FlowSubtaskProps) => {
    const { description, id, result, status, title } = subtask;
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const hasDetails = description || result;

    // Memoize search checks to avoid recalculating on every render
    const searchChecks = useMemo(() => {
        const trimmedSearch = searchValue.trim();

        if (!trimmedSearch) {
            return { hasDescriptionMatch: false, hasResultMatch: false };
        }

        return {
            hasDescriptionMatch: containsSearchValue(description, trimmedSearch),
            hasResultMatch: containsSearchValue(result, trimmedSearch),
        };
    }, [searchValue, description, result]);

    // Auto-expand details if they contain search matches
    useEffect(() => {
        const trimmedSearch = searchValue.trim();

        if (trimmedSearch) {
            // Expand details if description or result contains the search term
            if (searchChecks.hasDescriptionMatch || searchChecks.hasResultMatch) {
                setIsDetailsVisible(true);
            }
        } else {
            // Reset to default state when search is cleared
            setIsDetailsVisible(false);
        }
    }, [searchValue, searchChecks.hasDescriptionMatch, searchChecks.hasResultMatch]);

    return (
        <div className="group relative flex gap-3 rounded-lg py-2.5 transition-colors hover:bg-muted/20">
            {/* Status Icon */}
            <div className="shrink-0 pt-1">
                <FlowTaskStatusIcon
                    className="bg-background ring-border ring-background relative z-10 size-5 rounded-full ring-2 shadow-sm transition-transform group-hover:scale-110"
                    status={status}
                    tooltip={`Subtask ID: ${id}`}
                />
            </div>

            {/* Subtask Content */}
            <div className="flex flex-1 flex-col gap-2.5 min-w-0">
                {/* Subtask Title */}
                <div className="text-sm font-medium leading-snug">
                    <Markdown
                        className="prose-fixed prose-sm prose-headings:font-medium wrap-break-word *:m-0 [&>p]:leading-relaxed [&>p]:text-foreground"
                        searchValue={searchValue}
                    >
                        {title}
                    </Markdown>
                </div>

                {/* Details Toggle */}
                {hasDetails && (
                    <div className="mt-0.5">
                        <button
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:text-primary/90"
                            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                            type="button"
                        >
                            <span>{isDetailsVisible ? '▼' : '▶'}</span>
                            <span>{isDetailsVisible ? 'Hide details' : 'Show details'}</span>
                        </button>
                        {isDetailsVisible && (
                            <div className="mt-3 space-y-3">
                                {description && (
                                    <Card className="border-muted/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                                        <CardHeader className="border-b border-muted/50 bg-muted/40 pb-2.5 px-4 pt-4">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                                <ListTodo className="size-3.5 shrink-0 text-primary/70" />
                                                Description
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 pt-4">
                                            <Markdown
                                                className="prose-xs prose-fixed wrap-break-word prose-pre:bg-muted/50 prose-code:text-xs"
                                                searchValue={searchValue}
                                            >
                                                {description}
                                            </Markdown>
                                        </CardContent>
                                    </Card>
                                )}
                                {result && (
                                    <Card className="border-muted/50 bg-muted/30 shadow-sm transition-shadow hover:shadow-md">
                                        <CardHeader className="border-b border-muted/50 bg-muted/40 pb-2.5 px-4 pt-4">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                                <ListCheck className="size-3.5 shrink-0 text-emerald-500/70" />
                                                Result
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 pt-4">
                                            <Markdown
                                                className="prose-xs prose-fixed wrap-break-word prose-pre:bg-muted/50 prose-code:text-xs"
                                                searchValue={searchValue}
                                            >
                                                {result}
                                            </Markdown>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(FlowSubtask);
