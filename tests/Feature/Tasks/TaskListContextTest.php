<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

function taskPayload(): array
{
    return [
        'title' => 'Updated title',
        'status' => TaskStatus::InProgress->value,
        'priority' => TaskPriority::High->value,
    ];
}

function tasksIndexUrl(array $query = []): string
{
    return route('tasks.index', $query);
}

test('update returns to the filtered list it came from', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);
    $query = ['search' => 'report', 'status' => 'todo', 'priority' => 'high', 'page' => 2];

    $this->actingAs($user)
        ->withHeader('referer', tasksIndexUrl($query))
        ->patch(route('tasks.update', $task), taskPayload())
        ->assertRedirect(tasksIndexUrl($query));
});

test('destroy returns to the filtered list and page it came from', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);
    $query = ['due' => 'overdue', 'sort' => 'due_date', 'direction' => 'asc', 'page' => 3];

    $this->actingAs($user)
        ->withHeader('referer', tasksIndexUrl($query))
        ->delete(route('tasks.destroy', $task))
        ->assertRedirect(tasksIndexUrl($query));
});

test('store keeps filters but returns to the first page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeader('referer', tasksIndexUrl(['status' => 'done', 'page' => 4]))
        ->post(route('tasks.store'), taskPayload())
        ->assertRedirect(tasksIndexUrl(['status' => 'done']));
});

test('mutations without a referer return to the unfiltered list', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->patch(route('tasks.update', $task), taskPayload())
        ->assertRedirect(tasksIndexUrl());
});

test('referers that are not the tasks list are ignored', function (string $referer) {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->withHeader('referer', $referer)
        ->patch(route('tasks.update', $task), taskPayload())
        ->assertRedirect(tasksIndexUrl());
})->with([
    'external host' => 'https://evil.example/tasks?status=todo',
    'protocol-relative lookalike' => '//evil.example/tasks?status=todo',
    'other app page' => 'http://localhost/dashboard?status=todo',
    'tasks sub-path' => 'http://localhost/tasks/1/edit?status=todo',
    'malformed' => 'not a url',
]);

test('invalid and unknown list query parameters are dropped', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $referer = tasksIndexUrl().'?'.http_build_query([
        'status' => 'bogus',
        'priority' => 'urgent',
        'category_id' => 'abc',
        'due' => 'yesterday',
        'sort' => 'password',
        'direction' => 'sideways',
        'page' => '-1',
        'search' => ['nested' => 'array'],
        'redirect' => 'https://evil.example',
    ]);

    $this->actingAs($user)
        ->withHeader('referer', $referer)
        ->patch(route('tasks.update', $task), taskPayload())
        ->assertRedirect(tasksIndexUrl());
});

test('valid parameters survive alongside invalid ones', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $referer = tasksIndexUrl().'?search=++milk++&status=bogus&category_id=7&page=1';

    $this->actingAs($user)
        ->withHeader('referer', $referer)
        ->patch(route('tasks.update', $task), taskPayload())
        ->assertRedirect(tasksIndexUrl(['search' => 'milk', 'category_id' => 7]));
});

test('a page past the end redirects to the last page keeping filters', function () {
    $user = User::factory()->create();
    Task::factory()->count(16)->create(['user_id' => $user->id, 'status' => TaskStatus::Todo]);

    $this->actingAs($user)
        ->get(tasksIndexUrl(['status' => 'todo', 'page' => 5]))
        ->assertRedirect(tasksIndexUrl(['status' => 'todo', 'page' => 2]));
});

test('a page past the end of a single page list redirects without a page', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(tasksIndexUrl(['page' => 3]))
        ->assertRedirect(tasksIndexUrl());
});

test('an empty list on the first page renders without redirecting', function () {
    $this->actingAs(User::factory()->create())
        ->get(tasksIndexUrl(['status' => 'done']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tasks.data', 0));
});

test('filters prop reflects the query and exposes cleared search as null', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(tasksIndexUrl(['search' => '  groceries  ', 'status' => 'todo']))
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', 'groceries')
            ->where('filters.status', 'todo')
        );

    $this->actingAs($user)
        ->get(tasksIndexUrl().'?search=&status=')
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', null)
            ->where('filters.status', null)
        );
});

test('clearing search and filters returns every task', function () {
    $user = User::factory()->create();
    Task::factory()->count(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(tasksIndexUrl(['page' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tasks.data', 3));
});
