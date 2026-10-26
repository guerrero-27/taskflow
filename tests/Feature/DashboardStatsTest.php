<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    // Wednesday; the due-soon window runs 2026-10-21 through 2026-10-27.
    $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
    $this->user = User::factory()->create();
});

function dashboardTask(User $user, array $attributes = []): Task
{
    return Task::factory()->create([
        'user_id' => $user->id,
        'status' => TaskStatus::Todo,
        'due_date' => null,
        ...$attributes,
    ]);
}

test('a user with no tasks gets null completion and empty lists', function () {
    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats', [
                'total' => 0,
                'active' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'overdue' => 0,
                'due_soon' => 0,
                'completion_rate' => null,
            ])
            ->where('upcoming_tasks', [])
            ->where('recent_tasks', [])
            ->where('upcoming_days', 7)
        );
});

test('a user with no tasks only runs the status-count and categories queries', function () {
    $this->actingAs($this->user);
    DB::enableQueryLog();

    $this->get(route('dashboard'))->assertOk();

    $taskQueries = collect(DB::getQueryLog())->filter(fn ($q) => str_contains($q['query'], '"tasks"') || str_contains($q['query'], '`tasks`'));
    expect($taskQueries)->toHaveCount(1);
});

test('statistics are computed server-side from the user\'s tasks', function () {
    dashboardTask($this->user, ['status' => TaskStatus::Todo, 'due_date' => '2026-10-19']);       // overdue
    dashboardTask($this->user, ['status' => TaskStatus::InProgress, 'due_date' => '2026-10-21']); // due soon
    dashboardTask($this->user, ['status' => TaskStatus::InProgress]);
    dashboardTask($this->user, ['status' => TaskStatus::Done, 'due_date' => '2026-10-10']);       // done, not overdue
    dashboardTask($this->user, ['status' => TaskStatus::Done]);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('stats', [
            'total' => 5,
            'active' => 3,
            'in_progress' => 2,
            'completed' => 2,
            'overdue' => 1,
            'due_soon' => 1,
            'completion_rate' => 40,
        ]));
});

test('statistics and lists ignore other users\' tasks and categories', function () {
    $other = User::factory()->create();
    dashboardTask($other, ['status' => TaskStatus::Done]);
    dashboardTask($other, ['status' => TaskStatus::Todo, 'due_date' => '2026-10-19']);
    dashboardTask($other, ['status' => TaskStatus::Todo, 'due_date' => '2026-10-22']);
    Category::factory()->create(['user_id' => $other->id, 'name' => 'Not mine']);

    $mine = dashboardTask($this->user, ['due_date' => '2026-10-23', 'title' => 'Mine']);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.total', 1)
            ->where('stats.overdue', 0)
            ->where('stats.due_soon', 1)
            ->has('upcoming_tasks', 1)
            ->where('upcoming_tasks.0.id', $mine->id)
            ->has('recent_tasks', 1)
            ->where('recent_tasks.0.id', $mine->id)
            ->has('categories', 0)
        );
});

test('soft-deleted tasks are excluded everywhere', function () {
    dashboardTask($this->user, ['status' => TaskStatus::Done]);
    dashboardTask($this->user, ['due_date' => '2026-10-19'])->delete();
    dashboardTask($this->user, ['due_date' => '2026-10-22'])->delete();
    dashboardTask($this->user, ['status' => TaskStatus::Todo])->delete();

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.total', 1)
            ->where('stats.completed', 1)
            ->where('stats.overdue', 0)
            ->where('stats.due_soon', 0)
            ->where('stats.completion_rate', 100)
            ->has('upcoming_tasks', 0)
            ->has('recent_tasks', 1)
        );
});

test('completion rate boundaries', function (int $done, int $notDone, int $expected) {
    for ($i = 0; $i < $done; $i++) {
        dashboardTask($this->user, ['status' => TaskStatus::Done]);
    }
    for ($i = 0; $i < $notDone; $i++) {
        dashboardTask($this->user, ['status' => TaskStatus::InProgress]);
    }

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('stats.completion_rate', $expected));
})->with([
    'nothing done' => [0, 3, 0],
    'everything done' => [4, 0, 100],
    'one third rounds down' => [1, 2, 33],
    'two thirds rounds down' => [2, 1, 66],
    '199 of 200 is not 100%' => [199, 1, 99],
]);

test('upcoming deadlines are ordered by due date then id and limited to five', function () {
    $ids = [];
    foreach (['2026-10-27', '2026-10-22', '2026-10-21', '2026-10-25', '2026-10-22', '2026-10-24', '2026-10-26'] as $date) {
        $ids[$date][] = dashboardTask($this->user, ['due_date' => $date])->id;
    }
    dashboardTask($this->user, ['due_date' => '2026-10-20']);                            // overdue
    dashboardTask($this->user, ['due_date' => '2026-10-23', 'status' => TaskStatus::Done]); // done
    dashboardTask($this->user, ['due_date' => '2026-10-28']);                            // outside window

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.due_soon', 7)
            ->has('upcoming_tasks', 5)
            ->where('upcoming_tasks', fn ($tasks) => collect($tasks)->pluck('id')->all() === [
                $ids['2026-10-21'][0],
                $ids['2026-10-22'][0],
                $ids['2026-10-22'][1],
                $ids['2026-10-24'][0],
                $ids['2026-10-25'][0],
            ])
            ->where('upcoming_tasks.0.due_date', '2026-10-21')
        );
});

test('recent tasks are the five most recently updated, with categories', function () {
    $category = Category::factory()->create(['user_id' => $this->user->id]);
    $tasks = collect(range(1, 7))->map(fn ($i) => dashboardTask($this->user, ['title' => "Task {$i}", 'category_id' => $category->id]));

    // Touch tasks 2 and 6 later so they jump to the top.
    $this->travel(1)->minutes();
    $tasks[1]->update(['title' => 'Task 2 updated']);
    $this->travel(1)->minutes();
    $tasks[5]->update(['title' => 'Task 6 updated']);

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('recent_tasks', 5)
            ->where('recent_tasks.0.title', 'Task 6 updated')
            ->where('recent_tasks.1.title', 'Task 2 updated')
            // Remaining ties on updated_at fall back to newest id first.
            ->where('recent_tasks.2.title', 'Task 7')
            ->where('recent_tasks.3.title', 'Task 5')
            ->where('recent_tasks.4.title', 'Task 4')
            ->where('recent_tasks.0.category.id', $category->id)
        );
});

test('dashboard with tasks stays within the planned query budget', function () {
    dashboardTask($this->user, ['due_date' => '2026-10-22']);
    dashboardTask($this->user, ['status' => TaskStatus::Done]);
    $this->actingAs($this->user);
    DB::enableQueryLog();

    $this->get(route('dashboard'))->assertOk();

    $appQueries = collect(DB::getQueryLog())->filter(fn ($q) => preg_match('/["`](tasks|categories)["`]/', $q['query']));
    expect($appQueries->count())->toBeLessThanOrEqual(8);
});

// Add Task from the dashboard

function newTaskPayload(): array
{
    return ['title' => 'From dashboard', 'status' => TaskStatus::Todo->value, 'priority' => TaskPriority::Medium->value];
}

test('creating a task from the dashboard returns to the dashboard with a toast', function () {
    $this->actingAs($this->user)
        ->withHeader('referer', route('dashboard'))
        ->post(route('tasks.store'), newTaskPayload())
        ->assertRedirect(route('dashboard'));

    expect($this->user->tasks()->where('title', 'From dashboard')->exists())->toBeTrue();

    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.total', 1)
            ->where('recent_tasks.0.title', 'From dashboard')
        );
});

test('a dashboard referer with a query string still returns to the dashboard', function () {
    $this->actingAs($this->user)
        ->withHeader('referer', route('dashboard').'?utm=x#top')
        ->post(route('tasks.store'), newTaskPayload())
        ->assertRedirect(route('dashboard'));
});

test('other referers keep the existing Tasks list redirect', function (string $referer, string $expected) {
    $this->actingAs($this->user)
        ->withHeader('referer', $referer)
        ->post(route('tasks.store'), newTaskPayload())
        ->assertRedirect($expected);
})->with([
    'tasks list keeps filters' => [fn () => route('tasks.index', ['status' => 'todo']), fn () => route('tasks.index', ['status' => 'todo'])],
    'external lookalike' => ['https://evil.example/dashboard', fn () => route('tasks.index')],
    'dashboard sub-path' => [fn () => route('dashboard').'/x', fn () => route('tasks.index')],
    'categories page' => [fn () => route('categories.index'), fn () => route('tasks.index')],
]);

test('validation errors from the dashboard do not create a task', function () {
    $this->actingAs($this->user)
        ->withHeader('referer', route('dashboard'))
        ->post(route('tasks.store'), ['title' => ''])
        ->assertRedirect(route('dashboard'))
        ->assertInvalid('title');

    expect($this->user->tasks()->count())->toBe(0);
});
