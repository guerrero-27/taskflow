<?php

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Create a task for $user due on $date (Y-m-d or null) with the given status.
 */
function taskDue(User $user, ?string $date, TaskStatus $status = TaskStatus::Todo): Task
{
    return Task::factory()->create(['user_id' => $user->id, 'due_date' => $date, 'status' => $status]);
}

/**
 * @return list<string|null>
 */
function dueDatesOf($query): array
{
    return $query->orderBy('due_date')->get()->map(fn (Task $task) => $task->due_date?->toDateString())->all();
}

beforeEach(function () {
    $this->user = User::factory()->create();
    // Wednesday; the current week runs Monday 2026-10-19 to Sunday 2026-10-25.
    $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
});

test('overdue includes only incomplete tasks due before today', function () {
    $yesterdayTodo = taskDue($this->user, '2026-10-20');
    $yesterdayInProgress = taskDue($this->user, '2026-10-20', TaskStatus::InProgress);
    taskDue($this->user, '2026-10-20', TaskStatus::Done);
    taskDue($this->user, '2026-10-21');
    taskDue($this->user, '2026-10-22');
    taskDue($this->user, null);

    expect(Task::overdue()->pluck('id')->sort()->values()->all())
        ->toBe([$yesterdayTodo->id, $yesterdayInProgress->id]);
});

test('a task due today is not overdue, and becomes overdue the next day', function () {
    $task = taskDue($this->user, '2026-10-21');

    expect(Task::overdue()->exists())->toBeFalse()
        ->and($task->fresh()->is_overdue)->toBeFalse();

    $this->travelTo(Carbon::parse('2026-10-22 00:00:00'));

    expect(Task::overdue()->exists())->toBeTrue()
        ->and($task->fresh()->is_overdue)->toBeTrue();
});

test('the is_overdue attribute agrees with the overdue scope', function () {
    foreach (['2026-10-01', '2026-10-20', '2026-10-21', '2026-10-30', null] as $date) {
        foreach (TaskStatus::cases() as $status) {
            taskDue($this->user, $date, $status);
        }
    }

    $scoped = Task::overdue()->pluck('id')->sort()->values()->all();
    $byAttribute = Task::all()->filter->is_overdue->pluck('id')->sort()->values()->all();

    expect($scoped)->toBe($byAttribute)->not->toBeEmpty();
});

test('due today matches only today, in any status', function () {
    taskDue($this->user, '2026-10-20');
    taskDue($this->user, '2026-10-21');
    taskDue($this->user, '2026-10-21', TaskStatus::Done);
    taskDue($this->user, '2026-10-22');

    expect(dueDatesOf(Task::dueToday()))->toBe(['2026-10-21', '2026-10-21']);
});

test('due this week runs from today through Sunday and includes completed tasks', function () {
    taskDue($this->user, '2026-10-19'); // Monday of this week, already past
    taskDue($this->user, '2026-10-20'); // yesterday
    taskDue($this->user, '2026-10-21'); // today
    taskDue($this->user, '2026-10-23', TaskStatus::Done);
    taskDue($this->user, '2026-10-25'); // Sunday, last day of the week
    taskDue($this->user, '2026-10-26'); // next Monday
    taskDue($this->user, null);

    expect(dueDatesOf(Task::dueThisWeek()))->toBe(['2026-10-21', '2026-10-23', '2026-10-25']);
});

test('due this week combined with incomplete excludes completed tasks', function () {
    taskDue($this->user, '2026-10-21', TaskStatus::InProgress);
    taskDue($this->user, '2026-10-23', TaskStatus::Done);
    taskDue($this->user, '2026-10-25');

    expect(dueDatesOf(Task::dueThisWeek()->incomplete()))->toBe(['2026-10-21', '2026-10-25']);
});

test('on Sunday the week contains only today', function () {
    $this->travelTo(Carbon::parse('2026-10-25 23:59:59'));
    taskDue($this->user, '2026-10-24');
    taskDue($this->user, '2026-10-25');
    taskDue($this->user, '2026-10-26');

    expect(dueDatesOf(Task::dueThisWeek()))->toBe(['2026-10-25']);
});

test('on Monday the week covers Monday through Sunday', function () {
    $this->travelTo(Carbon::parse('2026-10-26 00:00:00'));
    taskDue($this->user, '2026-10-25');
    taskDue($this->user, '2026-10-26');
    taskDue($this->user, '2026-11-01');
    taskDue($this->user, '2026-11-02');

    expect(dueDatesOf(Task::dueThisWeek()))->toBe(['2026-10-26', '2026-11-01']);
});

test('date scopes use the configured application timezone', function () {
    // 17:00 UTC on Wednesday is already 01:00 Thursday in Manila.
    config(['app.timezone' => 'Asia/Manila']);
    $this->travelTo(Carbon::parse('2026-10-21 17:00:00', 'UTC'));

    $wednesday = taskDue($this->user, '2026-10-21');
    taskDue($this->user, '2026-10-22');

    expect(Task::overdue()->pluck('id')->all())->toBe([$wednesday->id])
        ->and($wednesday->fresh()->is_overdue)->toBeTrue()
        ->and(dueDatesOf(Task::dueToday()))->toBe(['2026-10-22']);
});
