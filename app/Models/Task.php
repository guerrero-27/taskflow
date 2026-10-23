<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Support\TaskListFilters;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $category_id
 * @property string $title
 * @property string|null $description
 * @property TaskStatus $status
 * @property TaskPriority $priority
 * @property Carbon|null $due_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read bool $is_overdue
 * @property-read User $user
 * @property-read Category|null $category
 */
#[Fillable(['title', 'description', 'status', 'priority', 'due_date', 'category_id'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory, SoftDeletes;

    protected $appends = ['is_overdue'];

    protected $attributes = [
        'status' => 'todo',
        'priority' => 'medium',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_date' => 'date:Y-m-d',
        ];
    }

    public function isOverdue(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->due_date !== null
                && $this->due_date->toDateString() < static::currentDate()->toDateString()
                && $this->status !== TaskStatus::Done,
        );
    }

    /**
     * Today's date (midnight) in the application's configured timezone.
     *
     * Due dates are calendar dates with no timezone, so every date rule compares
     * them against the app's local calendar day, bound as a "Y-m-d" string to match
     * how due_date is stored (DATE in MySQL, "Y-m-d" text in SQLite).
     */
    protected static function currentDate(): CarbonImmutable
    {
        return CarbonImmutable::today(config('app.timezone'));
    }

    /**
     * Tasks that are not done.
     *
     * @param  Builder<Task>  $query
     */
    public function scopeIncomplete(Builder $query): void
    {
        $query->where('status', '!=', TaskStatus::Done->value);
    }

    /**
     * Incomplete tasks whose due date is before today. Tasks due today are not overdue.
     *
     * @param  Builder<Task>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->where('due_date', '<', static::currentDate()->toDateString())->incomplete();
    }

    /**
     * Tasks due today, in any status.
     *
     * @param  Builder<Task>  $query
     */
    public function scopeDueToday(Builder $query): void
    {
        $today = static::currentDate();

        $query->where('due_date', $today->toDateString());
    }

    /**
     * Tasks due from today through the end of the current Monday–Sunday week, in any status.
     *
     * Completed tasks are included on purpose: the Tasks list "This week" filter shows
     * everything due this week. Combine with incomplete() for an "active" count, as the
     * dashboard does. Past-due tasks are not included; see overdue().
     *
     * @param  Builder<Task>  $query
     */
    public function scopeDueThisWeek(Builder $query): void
    {
        $today = static::currentDate();

        $query->where('due_date', '>=', $today->toDateString())
            ->where('due_date', '<=', $today->endOfWeek(CarbonInterface::SUNDAY)->toDateString());
    }

    /**
     * Apply validated Tasks list filters and a deterministic sort order.
     *
     * @param  Builder<Task>  $query
     */
    public function scopeFilter(Builder $query, TaskListFilters $filters): void
    {
        $query
            ->when($filters->search, function (Builder $query, string $search) {
                // Search is literal: escape LIKE wildcards. "!" is used as the escape
                // character because backslash handling differs between MySQL and SQLite.
                $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';

                $query->where(fn (Builder $query) => $query
                    ->whereRaw("title like ? escape '!'", [$term])
                    ->orWhereRaw("description like ? escape '!'", [$term])
                );
            })
            ->when($filters->status, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters->priority, fn (Builder $query, string $priority) => $query->where('priority', $priority))
            ->when($filters->categoryId, fn (Builder $query, int $categoryId) => $query->where('category_id', $categoryId))
            ->when($filters->due, fn (Builder $query, string $due) => match ($due) {
                'overdue' => $query->overdue(),
                'today' => $query->dueToday(),
                'this_week' => $query->dueThisWeek(),
                'no_due' => $query->whereNull('due_date'),
            })
            ->orderBy($filters->sort, $filters->direction)
            // Unique tie-breaker so rows with equal sort values never shift between pages.
            ->orderBy('id', $filters->direction);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
