<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

test('guests are redirected from task index', function () {
    $this->get(route('tasks.index'))->assertRedirect(route('login'));
});

test('guests are redirected from task create', function () {
    $this->get(route('tasks.create'))->assertRedirect(route('login'));
});

test('guests cannot store tasks', function () {
    $this->post(route('tasks.store'), [])->assertRedirect(route('login'));
});

test('authenticated user can view task index', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('tasks.index'))
        ->assertOk();
});

test('authenticated user can view task create page', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('tasks.create'))
        ->assertOk();
});

test('user can create a task', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('tasks.store'), [
            'title' => 'My new task',
            'description' => 'Some notes',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
            'due_date' => null,
            'category_id' => null,
        ])
        ->assertRedirect(route('tasks.index'));

    $this->assertDatabaseHas('tasks', [
        'user_id' => $user->id,
        'title' => 'My new task',
        'status' => 'todo',
        'priority' => 'medium',
    ]);
});

test('user_id is never taken from request input', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();

    $this->actingAs($attacker)->post(route('tasks.store'), [
        'user_id' => $owner->id,
        'title' => 'Injected task',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Medium->value,
    ]);

    $this->assertDatabaseMissing('tasks', [
        'user_id' => $owner->id,
        'title' => 'Injected task',
    ]);
});

test('user can view their own task edit page', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('tasks.edit', $task))
        ->assertOk();
});

test('user can update their task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id, 'title' => 'Old title']);

    $this->actingAs($user)
        ->patch(route('tasks.update', $task), [
            'title' => 'Updated title',
            'description' => null,
            'status' => TaskStatus::InProgress->value,
            'priority' => TaskPriority::High->value,
            'due_date' => null,
            'category_id' => null,
        ])
        ->assertRedirect(route('tasks.index'));

    expect($task->fresh()->title)->toBe('Updated title')
        ->and($task->fresh()->status)->toBe(TaskStatus::InProgress);
});

test('user can soft delete their task', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);
    $id = $task->id;

    $this->actingAs($user)
        ->delete(route('tasks.destroy', $task))
        ->assertRedirect(route('tasks.index'));

    expect(Task::find($id))->toBeNull()
        ->and(Task::withTrashed()->find($id))->not->toBeNull();
});
