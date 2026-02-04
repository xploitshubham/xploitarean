import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash/debounce';
import { ListTodo, Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Form, FormControl, FormField } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Badge } from '@/components/ui/badge';
import { StatusType } from '@/graphql/types';
import { useFlow } from '@/providers/flow-provider';

import FlowTask from './flow-task';

const searchFormSchema = z.object({
    search: z.string(),
});

// Helper function to check if text contains search value (case-insensitive)
const containsSearchValue = (text: null | string | undefined, searchValue: string): boolean => {
    if (!text || !searchValue.trim()) {
        return false;
    }

    return text.toLowerCase().includes(searchValue.toLowerCase().trim());
};

const FlowTasks = () => {
    const { flowData, flowId, isLoading } = useFlow();

    const tasks = useMemo(() => flowData?.tasks ?? [], [flowData?.tasks]);
    // Separate state for immediate input value and debounced search value
    const [debouncedSearchValue, setDebouncedSearchValue] = useState('');

    const form = useForm<z.infer<typeof searchFormSchema>>({
        defaultValues: {
            search: '',
        },
        resolver: zodResolver(searchFormSchema),
    });

    const searchValue = form.watch('search');

    // Create debounced function to update search value
    const debouncedUpdateSearch = useMemo(
        () =>
            debounce((value: string) => {
                setDebouncedSearchValue(value);
            }, 500),
        [],
    );

    // Update debounced search value when input value changes
    useEffect(() => {
        debouncedUpdateSearch(searchValue);

        return () => {
            debouncedUpdateSearch.cancel();
        };
    }, [searchValue, debouncedUpdateSearch]);

    // Cleanup debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedUpdateSearch.cancel();
        };
    }, [debouncedUpdateSearch]);

    // Clear search when flow changes to prevent stale search state
    useEffect(() => {
        form.reset({ search: '' });
        setDebouncedSearchValue('');
        debouncedUpdateSearch.cancel();
    }, [flowId, form, debouncedUpdateSearch]);

    // Memoize filtered tasks to avoid recomputing on every render
    // Use debouncedSearchValue for filtering to improve performance
    const filteredTasks = useMemo(() => {
        const search = debouncedSearchValue.toLowerCase().trim();

        if (!search || !tasks) {
            return tasks || [];
        }

        return tasks.filter((task) => {
            const taskMatches = containsSearchValue(task.title, search) || containsSearchValue(task.result, search);

            const subtaskMatches =
                task.subtasks?.some(
                    (subtask) =>
                        containsSearchValue(subtask.title, search) ||
                        containsSearchValue(subtask.description, search) ||
                        containsSearchValue(subtask.result, search),
                ) || false;

            return taskMatches || subtaskMatches;
        });
    }, [tasks, debouncedSearchValue]);

    const sortedTasks = [...(filteredTasks || [])].sort((a, b) => +a.id - +b.id);
    const hasTasks = sortedTasks.length > 0;

    const totalTasks = tasks?.length ?? 0;
    const visibleTasks = sortedTasks.length;
    const completedTasks = sortedTasks.filter((task) => task.status === StatusType.Finished).length;

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Loading tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Professional Search Bar */}
            <div className="sticky top-0 z-10 border-b border-muted/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 shadow-sm">
                <Form {...form}>
                    <FormField
                        control={form.control}
                        name="search"
                        render={({ field }) => (
                            <FormControl>
                                <div className="relative">
                                    <InputGroup className="shadow-sm">
                                        <InputGroupAddon className="bg-muted/50">
                                            <Search className="size-4 text-muted-foreground" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            {...field}
                                            autoComplete="off"
                                            className="bg-background border-muted/50 focus:border-primary/50 focus:ring-primary/20"
                                            placeholder="Search tasks and subtasks..."
                                            type="text"
                                        />
                                        {field.value && (
                                            <InputGroupAddon align="inline-end" className="bg-muted/50">
                                                <InputGroupButton
                                                    className="hover:bg-muted"
                                                    onClick={() => {
                                                        form.reset({ search: '' });
                                                        setDebouncedSearchValue('');
                                                        debouncedUpdateSearch.cancel();
                                                    }}
                                                    type="button"
                                                >
                                                    <X className="size-4" />
                                                </InputGroupButton>
                                            </InputGroupAddon>
                                        )}
                                    </InputGroup>
                                </div>
                            </FormControl>
                        )}
                    />
                </Form>
            </div>

            {/* Tasks Summary with Professional Styling */}
            <div className="border-b border-muted/50 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent px-6 py-3">
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-foreground">Overview:</span>
                    <Badge
                        className="border-primary/30 bg-primary/5 text-[11px] font-medium text-primary"
                        variant="outline"
                    >
                        Total {totalTasks}
                    </Badge>
                    <Badge
                        className="border-emerald-400/40 bg-emerald-500/5 text-[11px] font-medium text-emerald-400"
                        variant="outline"
                    >
                        Completed {completedTasks}
                    </Badge>
                    <Badge
                        className="border-muted/60 bg-muted/30 text-[11px] font-medium"
                        variant="outline"
                    >
                        Showing {visibleTasks}
                    </Badge>
                </div>
            </div>

            {/* Tasks List */}
            {hasTasks ? (
                <div className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-6">
                    {sortedTasks.map((task) => (
                        <FlowTask
                            key={task.id}
                            searchValue={debouncedSearchValue}
                            task={task}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center px-6 py-12">
                    <Empty className="max-w-md">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                                    <ListTodo className="size-8 text-primary/60" />
                                </div>
                            </EmptyMedia>
                            <EmptyTitle className="text-lg font-semibold">No tasks found</EmptyTitle>
                            <EmptyDescription className="text-sm text-muted-foreground">
                                {debouncedSearchValue
                                    ? 'No tasks match your search criteria. Try a different search term.'
                                    : 'Tasks will appear here once the agent starts executing the recon flow.'}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </div>
            )}
        </div>
    );
};

export default FlowTasks;
