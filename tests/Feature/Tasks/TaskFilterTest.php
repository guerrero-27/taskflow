<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;

test('search by title returns matching tasks only', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'title' => 'Buy groceries', 'description' => null]);
    Task::factory()->create(['user_id' => $user->id, 'title' => 'Call dentist', 'description' => null]);

    $this->actingAs($user)
        ->get(route('tasks.index', ['search' => 'groceries']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.title', 'Buy groceries')
        );
});

test('search by description returns matching tasks only', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'title' => 'Task A', 'description' => 'Contains keyword here']);
    Task::factory()->create(['user_id' => $user->id, 'title' => 'Task B', 'description' => 'Different text']);

    $this->actingAs($user)
        ->get(route('tasks.index', ['search' => 'keyword']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('tasks.data.0.title', 'Task A')
        );
});

test('status filter returns only matching tasks', function () {
    $user = User::factory()->create();
    Task::factory(3)->todo()->create(['user_id' => $user->id]);
    Task::factory(2)->done()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('tasks.index', ['status' => 'todo']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tasks.data', 3));
});

test('priority filter returns only matching tasks', function () {
    $user = User::factory()->create();
    Task::factory(2)->create(['user_id' => $user->id, 'priority' => TaskPriority::High->value]);
    Task::factory(4)->create(['user_id' => $user->id, 'priority' => TaskPriority::Low->value]);

    $this->actingAs($user)
        ->get(route('tasks.index', ['priority' => 'high']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tasks.data', 2));
});

test('category filter returns only matching tasks', function () {
    $user = User::factory()->create();
    $cat = Category::factory()->create(['user_id' => $user->id]);
    Task::factory(2)->create(['user_id' => $user->id, 'category_id' => $cat->id]);
    Task::factory(3)->create(['user_id' => $user->id, 'category_id' => null]);

    $this->actingAs($user)
        ->get(route('tasks.index', ['category_id' => $cat->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tasks.data', 2));
});

test('tasks are paginated at 15 per page', function () {
    $user = User::factory()->create();
    Task::factory(16)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 15)
            ->where('tasks.total', 16)
        );
});

test('active filters are returned as props', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('tasks.index', ['status' => 'todo', 'search' => 'test']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.status', 'todo')
            ->where('filters.search', 'test')
        );
});
