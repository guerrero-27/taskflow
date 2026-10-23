<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

test('user cannot update another user\'s task', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $owner->id, 'title' => 'Original']);

    $this->actingAs($attacker)
        ->patch(route('tasks.update', $task), [
            'title' => 'Hacked',
            'status' => TaskStatus::Done->value,
            'priority' => TaskPriority::Low->value,
        ])
        ->assertForbidden();

    expect($task->fresh()->title)->toBe('Original');
});

test('user cannot delete another user\'s task', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($attacker)
        ->delete(route('tasks.destroy', $task))
        ->assertForbidden();

    expect(Task::find($task->id))->not->toBeNull();
});

test('task index only returns own tasks', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Task::factory()->create(['user_id' => $userA->id, 'title' => 'My Task']);
    Task::factory(3)->create(['user_id' => $userB->id]);

    $this->actingAs($userA)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.title', 'My Task')
        );
});
