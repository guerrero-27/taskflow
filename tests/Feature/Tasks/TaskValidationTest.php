<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\User;

test('task title is required', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
        ])
        ->assertInvalid('title');
});

test('task title cannot exceed 255 characters', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => str_repeat('a', 256),
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
        ])
        ->assertInvalid('title');
});

test('task status must be a valid enum value', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => 'invalid_status',
            'priority' => TaskPriority::Medium->value,
        ])
        ->assertInvalid('status');
});

test('task priority must be a valid enum value', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => TaskStatus::Todo->value,
            'priority' => 'invalid_priority',
        ])
        ->assertInvalid('priority');
});

test('task due_date must be a valid date string', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
            'due_date' => 'not-a-date',
        ])
        ->assertInvalid('due_date');
});

test('task category_id must belong to the authenticated user', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($attacker)
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
            'category_id' => $category->id,
        ])
        ->assertInvalid('category_id');
});

test('task accepts null category_id', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
            'category_id' => null,
        ])
        ->assertRedirect(route('tasks.index'));
});

test('task accepts null description', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('tasks.store'), [
            'title' => 'Test task',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
            'description' => null,
        ])
        ->assertRedirect(route('tasks.index'));
});
