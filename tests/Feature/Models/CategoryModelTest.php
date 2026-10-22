<?php

use App\Models\Category;
use App\Models\Task;
use App\Models\User;

test('category belongs to a user', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    expect($category->user->id)->toBe($user->id);
});

test('category has many tasks', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    Task::factory(3)->create(['user_id' => $user->id, 'category_id' => $category->id]);

    expect($category->tasks)->toHaveCount(3);
});

test('category stores name and color correctly', function () {
    $category = Category::factory()->create(['name' => 'Work', 'color' => '#6366f1']);

    expect($category->name)->toBe('Work')
        ->and($category->color)->toBe('#6366f1');
});

test('category color can be null', function () {
    $category = Category::factory()->create(['color' => null]);

    expect($category->color)->toBeNull();
});

test('category names are unique per user', function () {
    $user = User::factory()->create();
    Category::factory()->create(['user_id' => $user->id, 'name' => 'Personal']);

    expect(fn () => Category::factory()->create(['user_id' => $user->id, 'name' => 'Personal']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('same category name can exist for different users', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Category::factory()->create(['user_id' => $userA->id, 'name' => 'Work']);
    $second = Category::factory()->create(['user_id' => $userB->id, 'name' => 'Work']);

    expect($second->exists)->toBeTrue();
});
