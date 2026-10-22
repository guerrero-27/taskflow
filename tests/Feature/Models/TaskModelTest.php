<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;

test('task belongs to a user', function () {
    $task = Task::factory()->create();

    expect($task->user)->toBeInstanceOf(User::class);
});

test('task belongs to a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

    expect($task->category->id)->toBe($category->id);
});

test('task category can be null', function () {
    $task = Task::factory()->create(['category_id' => null]);

    expect($task->category)->toBeNull();
});

test('task status is cast to TaskStatus enum', function () {
    $task = Task::factory()->create(['status' => TaskStatus::InProgress]);

    expect($task->status)->toBe(TaskStatus::InProgress);
});

test('task priority is cast to TaskPriority enum', function () {
    $task = Task::factory()->create(['priority' => TaskPriority::High]);

    expect($task->priority)->toBe(TaskPriority::High);
});

test('task due_date is cast to a date object', function () {
    $task = Task::factory()->create(['due_date' => '2026-12-31']);

    expect($task->due_date)->toBeInstanceOf(DateTimeInterface::class)
        ->and($task->due_date->format('Y-m-d'))->toBe('2026-12-31');
});

test('task due_date can be null', function () {
    $task = Task::factory()->create(['due_date' => null]);

    expect($task->due_date)->toBeNull();
});

test('task defaults status to todo', function () {
    $user = User::factory()->create();
    $task = $user->tasks()->create(['title' => 'My task']);

    expect($task->status)->toBe(TaskStatus::Todo);
});

test('task defaults priority to medium', function () {
    $user = User::factory()->create();
    $task = $user->tasks()->create(['title' => 'My task']);

    expect($task->priority)->toBe(TaskPriority::Medium);
});

test('task is overdue when due date is in the past and not done', function () {
    $task = Task::factory()->overdue()->create();

    expect($task->is_overdue)->toBeTrue();
});

test('task is not overdue when status is done', function () {
    $task = Task::factory()->create([
        'due_date' => now()->subDays(2)->toDateString(),
        'status' => TaskStatus::Done,
    ]);

    expect($task->is_overdue)->toBeFalse();
});

test('task is not overdue when due date is today', function () {
    $task = Task::factory()->create([
        'due_date' => today()->toDateString(),
        'status' => TaskStatus::Todo,
    ]);

    expect($task->is_overdue)->toBeFalse();
});

test('task is not overdue when due date is in the future', function () {
    $task = Task::factory()->create([
        'due_date' => now()->addDays(7)->toDateString(),
        'status' => TaskStatus::Todo,
    ]);

    expect($task->is_overdue)->toBeFalse();
});

test('task is not overdue when due date is null', function () {
    $task = Task::factory()->create(['due_date' => null]);

    expect($task->is_overdue)->toBeFalse();
});

test('task is included in is_overdue when serialized', function () {
    $task = Task::factory()->overdue()->create();

    expect(array_key_exists('is_overdue', $task->toArray()))->toBeTrue();
});

test('task is soft deleted', function () {
    $task = Task::factory()->create();
    $id = $task->id;

    $task->delete();

    expect(Task::find($id))->toBeNull()
        ->and(Task::withTrashed()->find($id))->not->toBeNull();
});

test('soft deleted task can be restored', function () {
    $task = Task::factory()->create();
    $id = $task->id;

    $task->delete();
    Task::withTrashed()->find($id)->restore();

    expect(Task::find($id))->not->toBeNull();
});
