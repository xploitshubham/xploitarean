import { memo, useEffect, useMemo, useState } from 'react';

import type { TaskFragmentFragment } from '@/graphql/types';

import Markdown from '@/components/shared/markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusType } from '@/graphql/types';

import FlowSubtask from './flow-subtask';
import FlowTaskStatusIcon from './flow-task-status-icon';

interface FlowTaskProps {
    searchValue?: string;
    task: TaskFragmentFragment;
}

// Helper function to check if text contains search value (case-insensitive)
const containsSearchValue = (text: null | string | undefined, searchValue: string): boolean => {
    if (!text || !searchValue.trim()) {
        return false;
    }

    return text.toLowerCase().includes(searchValue.toLowerCase().trim());
};

const FlowTask = ({ searchValue = '', task }: FlowTaskProps) => {
    const { id, result, status, subtasks, title } = task;
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    // Memoize search checks to avoid recalculating on every render
    const searchChecks = useMemo(() => {
        const trimmedSearch = searchValue.trim();

        if (!trimmedSearch) {
            return { hasResultMatch: false };
        }

        return {
            hasResultMatch: containsSearchValue(result, trimmedSearch),
        };
    }, [searchValue, result]);

    // Auto-expand details if they contain search matches
    useEffect(() => {
        const trimmedSearch = searchValue.trim();

        if (trimmedSearch) {
            // Expand result block only if it contains the search term
            if (searchChecks.hasResultMatch) {
                setIsDetailsVisible(true);
            }
        } else {
            // Reset to default state when search is cleared
            setIsDetailsVisible(false);
        }
    }, [searchValue, searchChecks.hasResultMatch]);

    const sortedSubtasks = [...(subtasks || [])].sort((a, b) => +a.id - +b.id);
    const hasSubtasks = subtasks && subtasks.length > 0;

    // Calculate completed subtasks count
    const completedSubtasksCount = useMemo(() => {
        if (!subtasks?.length) {
            return 0;
        }

        return subtasks.filter((subtask) => subtask.status === StatusType.Finished).length;
    }, [subtasks]);

    // Calculate progress based on completed subtasks
    const progress = useMemo(() => {
        if (!subtasks?.length) {
            return 0;
        }

        return Math.round((completedSubtasksCount / subtasks.length) * 100);
    }, [subtasks, completedSubtasksCount]);

    return (
        <Card className="group relative overflow-hidden border-muted/50 bg-gradient-to-br from-card to-muted/10 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <CardContent className="relative p-6">
                <div className="relative flex gap-4">
                    {/* Status Icon */}
                    <div className="shrink-0 pt-0.5">
                        <FlowTaskStatusIcon
                            className="bg-background ring-border ring-background relative z-10 size-7 rounded-full ring-2 shadow-md transition-transform group-hover:scale-110"
                            status={status}
                            tooltip={`Task ID: ${id}`}
                        />
                    </div>

                    {/* Task Content */}
                    <div className="flex flex-1 flex-col gap-3.5 min-w-0">
                        {/* Task Title */}
                        <div className="font-semibold leading-snug">
                            <Markdown
                                className="prose-fixed prose-sm prose-headings:font-semibold wrap-break-word *:m-0 [&>p]:leading-relaxed [&>p]:text-foreground"
                                searchValue={searchValue}
                            >
                                {title}
                            </Markdown>
                        </div>

                        {/* Progress Bar */}
                        {hasSubtasks && progress < 100 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Progress
                                        className="h-2.5 flex-1 bg-muted/50 shadow-inner"
                                        value={progress}
                                    />
                                    <div className="shrink-0 rounded-md bg-muted/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                        {progress}% • {completedSubtasksCount}/{subtasks?.length}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Result Details */}
                        {result && (
                            <div className="mt-1">
                                <button
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/10 hover:text-primary/90"
                                    onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                                    type="button"
                                >
                                    <span>{isDetailsVisible ? '▼' : '▶'}</span>
                                    <span>{isDetailsVisible ? 'Hide details' : 'Show details'}</span>
                                </button>
                                {isDetailsVisible && (
                                    <Card className="mt-3 border-muted/50 bg-muted/40 shadow-sm">
                                        <CardContent className="p-4">
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
                </div>

                {/* Subtasks */}
                {hasSubtasks ? (
                    <div className="mt-5 ml-11 space-y-3 border-l-2 border-primary/20 pl-5">
                        {sortedSubtasks.map((subtask) => (
                            <FlowSubtask
                                key={subtask.id}
                                searchValue={searchValue}
                                subtask={subtask}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 ml-11 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground italic">
                        Waiting for subtasks to be created...
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default memo(FlowTask);
