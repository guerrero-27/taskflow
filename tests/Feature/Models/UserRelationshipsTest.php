<?php

use App\Models\Category;
use App\Models\Task;
use App\Models\User;

test('user has many tasks', function () {
    $user = User::factory()->create();
    Task::factory(3)->create(['user_id' => $user->id]);

    expect($user->tasks)->toHaveCount(3);
});

test('user has many categories', function () {
    $user = User::factory()->create();
    Category::factory(4)->create(['user_id' => $user->id]);

    expect($user->categories)->toHaveCount(4);
});

test("user tasks do not include another user's tasks", function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Task::factory(2)->create(['user_id' => $userA->id]);
    Task::factory(5)->create(['user_id' => $userB->id]);

    expect($userA->tasks)->toHaveCount(2)
        ->and($userB->tasks)->toHaveCount(5);
});

test("user categories do not include another user's categories", function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Category::factory(2)->create(['user_id' => $userA->id]);
    Category::factory(3)->create(['user_id' => $userB->id]);

    expect($userA->categories)->toHaveCount(2)
        ->and($userB->categories)->toHaveCount(3);
});

test('task category is nullified when category is deleted', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

    $category->delete();

    expect($task->fresh()->category_id)->toBeNull();
});
