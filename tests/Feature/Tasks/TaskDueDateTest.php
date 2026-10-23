<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

function validTaskPayload(array $overrides = []): array
{
    return [
        'title' => 'Dated task',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Medium->value,
        ...$overrides,
    ];
}

test('task index serializes due_date as Y-m-d', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'due_date' => '2026-10-23']);

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page
            ->where('tasks.data.0.due_date', '2026-10-23')
        );
});

test('task index serializes a missing due_date as null', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'due_date' => null]);

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertInertia(fn ($page) => $page
            ->where('tasks.data.0.due_date', null)
        );
});

test('dashboard recent tasks serialize due_date as Y-m-d', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'due_date' => '2026-10-23']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('recent_tasks.0.due_date', '2026-10-23')
        );
});

test('stored and updated due dates round-trip unchanged', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('tasks.store'), validTaskPayload(['due_date' => '2026-10-23']));
    $task = $user->tasks()->sole();
    expect($task->due_date->toDateString())->toBe('2026-10-23');

    $this->actingAs($user)->patch(route('tasks.update', $task), validTaskPayload(['due_date' => '2026-12-31']));
    expect($task->fresh()->due_date->toDateString())->toBe('2026-12-31');

    $this->actingAs($user)->patch(route('tasks.update', $task), validTaskPayload(['due_date' => null]));
    expect($task->fresh()->due_date)->toBeNull();
});

test('due date does not shift in timezones far from UTC', function (string $timezone) {
    $originalTimezone = date_default_timezone_get();
    config(['app.timezone' => $timezone]);
    date_default_timezone_set($timezone);

    try {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('tasks.store'), validTaskPayload(['due_date' => '2026-10-23']));

        $this->actingAs($user)
            ->get(route('tasks.index'))
            ->assertInertia(fn ($page) => $page
                ->where('tasks.data.0.due_date', '2026-10-23')
            );
    } finally {
        date_default_timezone_set($originalTimezone);
    }
})->with(['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Manila']);

test('due date must be a plain Y-m-d date', function (string $value) {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), validTaskPayload(['due_date' => $value]))
        ->assertInvalid('due_date');
})->with([
    'ISO datetime with offset' => '2026-10-23T00:00:00Z',
    'datetime' => '2026-10-23 15:00:00',
    'US format' => '10/23/2026',
    'impossible date' => '2026-02-30',
]);
