<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route;

function updatePayload(array $overrides = []): array
{
    return [
        'title' => 'Updated',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Low->value,
        ...$overrides,
    ];
}

// Removed routes

test('create and edit task routes are no longer registered', function () {
    expect(Route::has('tasks.create'))->toBeFalse()
        ->and(Route::has('tasks.edit'))->toBeFalse()
        ->and(Route::has('tasks.show'))->toBeFalse();
});

test('old create and edit URLs do not render pages', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)->get('/tasks/create')->assertMethodNotAllowed();
    $this->actingAs($user)->get("/tasks/{$task->id}/edit")->assertNotFound();
});

test('index, store, update and destroy routes remain', function () {
    expect(Route::has('tasks.index'))->toBeTrue()
        ->and(Route::has('tasks.store'))->toBeTrue()
        ->and(Route::has('tasks.update'))->toBeTrue()
        ->and(Route::has('tasks.destroy'))->toBeTrue();
});

// Authorization

test('updating another user\'s task is forbidden even with an invalid payload', function () {
    $task = Task::factory()->create(['title' => 'Original']);

    $this->actingAs(User::factory()->create())
        ->patch(route('tasks.update', $task), ['title' => ''])
        ->assertForbidden();

    expect($task->fresh()->title)->toBe('Original');
});

test('updating a missing or soft-deleted task returns 404', function () {
    $user = User::factory()->create();
    $deleted = Task::factory()->create(['user_id' => $user->id]);
    $deleted->delete();

    $this->actingAs($user)->patch(route('tasks.update', 999999), updatePayload())->assertNotFound();
    $this->actingAs($user)->patch(route('tasks.update', $deleted), updatePayload())->assertNotFound();
    $this->actingAs($user)->delete(route('tasks.destroy', $deleted))->assertNotFound();
});

test('update ignores user_id in the payload', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($owner)
        ->patch(route('tasks.update', $task), updatePayload(['user_id' => $other->id]))
        ->assertRedirect();

    expect($task->fresh()->user_id)->toBe($owner->id);
});

test('update rejects another user\'s category', function () {
    $owner = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $owner->id, 'category_id' => null]);
    $foreignCategory = Category::factory()->create();

    $this->actingAs($owner)
        ->patch(route('tasks.update', $task), updatePayload(['category_id' => $foreignCategory->id]))
        ->assertInvalid('category_id');

    expect($task->fresh()->category_id)->toBeNull();
});

// Invalid filters

test('invalid and malformed filters are ignored instead of failing', function (array $query) {
    $user = User::factory()->create();
    Task::factory()->count(2)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('tasks.index').'?'.http_build_query($query))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 2)
            ->where('filters', [
                'search' => null,
                'status' => null,
                'priority' => null,
                'category_id' => null,
                'due' => null,
                'sort' => null,
                'direction' => null,
            ])
        );
})->with([
    'unknown enum values' => [['status' => 'bogus', 'priority' => 'urgent', 'due' => 'yesterday']],
    'array values' => [['status' => ['todo'], 'priority' => ['high'], 'search' => ['x'], 'category_id' => ['1'], 'page' => ['2']]],
    'non-numeric ids and pages' => [['category_id' => 'abc', 'page' => 'abc']],
    'negative and zero ids' => [['category_id' => '-1', 'page' => '0']],
    'unsupported sort' => [['sort' => 'password', 'direction' => 'sideways']],
    'overlong search' => [['search' => str_repeat('a', 256)]],
]);

test('valid filters are kept alongside invalid ones', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'status' => TaskStatus::Done]);
    Task::factory()->create(['user_id' => $user->id, 'status' => TaskStatus::Todo]);

    $this->actingAs($user)
        ->get(route('tasks.index', ['status' => 'done', 'priority' => 'urgent']))
        ->assertInertia(fn ($page) => $page
            ->has('tasks.data', 1)
            ->where('filters.status', 'done')
            ->where('filters.priority', null)
        );
});

test('search treats LIKE wildcards literally', function (string $search, array $expected) {
    $user = User::factory()->create();
    foreach (['100% done', '1000 done', 'snake_case', 'snakeXcase', 'wow!', 'back\\slash'] as $title) {
        Task::factory()->create(['user_id' => $user->id, 'title' => $title, 'description' => null]);
    }

    $this->actingAs($user)
        ->get(route('tasks.index', ['search' => $search]))
        ->assertInertia(fn ($page) => $page
            ->where('tasks.data', fn ($tasks) => collect($tasks)->pluck('title')->sort()->values()->all() === $expected)
        );
})->with([
    'percent' => ['%', ['100% done']],
    'underscore' => ['_', ['snake_case']],
    'escape character' => ['!', ['wow!']],
    'backslash' => ['\\', ['back\\slash']],
    'plain text still matches partially' => ['done', ['100% done', '1000 done']],
]);

test('the due filter uses the shared scopes', function () {
    $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
    $user = User::factory()->create();
    foreach (['2026-10-20', '2026-10-21', '2026-10-25', '2026-10-26'] as $date) {
        Task::factory()->create(['user_id' => $user->id, 'due_date' => $date, 'status' => TaskStatus::Todo]);
    }
    Task::factory()->create(['user_id' => $user->id, 'due_date' => '2026-10-23', 'status' => TaskStatus::Done]);
    Task::factory()->create(['user_id' => $user->id, 'due_date' => '2026-10-19', 'status' => TaskStatus::Done]);

    $dueDates = fn (string $due) => fn ($page) => $page->where(
        'tasks.data',
        fn ($tasks) => collect($tasks)->pluck('due_date')->sort()->values()->all() === match ($due) {
            'overdue' => ['2026-10-20'],
            'today' => ['2026-10-21'],
            // The list's "this week" includes completed tasks.
            'this_week' => ['2026-10-21', '2026-10-23', '2026-10-25'],
        },
    );

    foreach (['overdue', 'today', 'this_week'] as $due) {
        $this->actingAs($user)->get(route('tasks.index', ['due' => $due]))->assertInertia($dueDates($due));
    }
});

test('dashboard counts use the shared scopes and exclude completed tasks', function () {
    $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
    $user = User::factory()->create();
    $make = fn (string $date, TaskStatus $status) => Task::factory()
        ->create(['user_id' => $user->id, 'due_date' => $date, 'status' => $status]);

    // Rolling 7-day window: 2026-10-21 through 2026-10-27.
    $make('2026-10-20', TaskStatus::Todo);        // overdue
    $make('2026-10-20', TaskStatus::Done);        // done, not overdue
    $make('2026-10-21', TaskStatus::Todo);        // due today: due soon, not overdue
    $make('2026-10-25', TaskStatus::InProgress);  // due soon
    $make('2026-10-23', TaskStatus::Done);        // in window but done
    $make('2026-10-27', TaskStatus::Todo);        // last day of the window
    $make('2026-10-28', TaskStatus::Todo);        // outside the window

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.overdue', 1)
            ->where('stats.due_soon', 3)
        );
});

// Pagination

test('pagination is deterministic when sort values tie', function (array $query, string $direction) {
    $user = User::factory()->create();
    $this->freezeTime();
    $ids = Task::factory()->count(20)->create(['user_id' => $user->id, 'title' => 'Same'])->pluck('id');

    $pageIds = function (int $page) use ($user, $query) {
        $ids = null;
        $this->actingAs($user)
            ->get(route('tasks.index', [...$query, 'page' => $page]))
            ->assertInertia(function ($inertia) use (&$ids) {
                $ids = collect($inertia->toArray()['props']['tasks']['data'])->pluck('id')->all();
            });

        return $ids;
    };

    $expected = $direction === 'asc' ? $ids->sort()->values() : $ids->sortDesc()->values();

    expect([...$pageIds(1), ...$pageIds(2)])->toBe($expected->all())
        ->and($pageIds(1))->toBe($pageIds(1));
})->with([
    'default created_at desc' => [[], 'desc'],
    'title asc' => [['sort' => 'title', 'direction' => 'asc'], 'asc'],
]);

test('pagination links keep valid filters and drop invalid ones', function () {
    $user = User::factory()->create();
    Task::factory()->count(20)->create(['user_id' => $user->id, 'status' => TaskStatus::Todo]);

    $this->actingAs($user)
        ->get(route('tasks.index').'?status=todo&priority=urgent&evil=1')
        ->assertInertia(fn ($page) => $page
            ->where('tasks.next_page_url', route('tasks.index', ['status' => 'todo', 'page' => 2]))
        );
});
