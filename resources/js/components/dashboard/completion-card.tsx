type Props = {
    rate: number;
    completed: number;
    total: number;
};

/** Completion progress. Only rendered when the user has tasks, so the rate is real. */
export function CompletionCard({ rate, completed, total }: Props) {
    const detail = `${completed} of ${total} ${total === 1 ? 'task' : 'tasks'} completed`;

    return (
        <section
            aria-labelledby="completion-heading"
            className="animate-in rounded-xl border bg-card p-4 shadow-sm duration-300 fade-in-0 motion-reduce:animate-none sm:p-5"
        >
            <div className="flex items-baseline justify-between gap-4">
                <h3 id="completion-heading" className="font-semibold">
                    Completion
                </h3>
                <span
                    className="text-2xl font-semibold tabular-nums"
                    aria-hidden="true"
                >
                    {rate}%
                </span>
            </div>
            <div
                role="progressbar"
                aria-labelledby="completion-heading"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={rate}
                aria-valuetext={`${rate}%, ${detail}`}
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            >
                <div
                    className="h-full rounded-full bg-indigo-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${rate}%` }}
                />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
                {detail}
                {rate === 100 && ' — all caught up.'}
            </p>
        </section>
    );
}
