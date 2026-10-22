<?php

use App\Models\Category;
use App\Models\Task;
use App\Models\User;

test('guests are redirected from category index', function () {
    $this->get(route('categories.index'))->assertRedirect(route('login'));
});

test('guests cannot create categories', function () {
    $this->post(route('categories.store'), [])->assertRedirect(route('login'));
});

test('authenticated user can view their categories', function () {
    $user = User::factory()->create();
    Category::factory(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertOk();
});

test('user can create a category', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), ['name' => 'Work', 'color' => '#6366f1'])
        ->assertRedirect(route('categories.index'));

    $this->assertDatabaseHas('categories', [
        'user_id' => $user->id,
        'name' => 'Work',
        'color' => '#6366f1',
    ]);
});

test('category name must be unique per user', function () {
    $user = User::factory()->create();
    Category::factory()->create(['user_id' => $user->id, 'name' => 'Work']);

    $this->actingAs($user)
        ->post(route('categories.store'), ['name' => 'Work'])
        ->assertInvalid('name');
});

test('user can update their category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Old Name']);

    $this->actingAs($user)
        ->patch(route('categories.update', $category), ['name' => 'New Name', 'color' => null])
        ->assertRedirect(route('categories.index'));

    expect($category->fresh()->name)->toBe('New Name');
});

test('user can update their category keeping the same name', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Work']);

    $this->actingAs($user)
        ->patch(route('categories.update', $category), ['name' => 'Work', 'color' => '#ff0000'])
        ->assertRedirect(route('categories.index'));

    expect($category->fresh()->color)->toBe('#ff0000');
});

test('user can delete their category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('categories.destroy', $category))
        ->assertRedirect(route('categories.index'));

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

test('deleting a category sets task category_id to null', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

    $this->actingAs($user)->delete(route('categories.destroy', $category));

    expect($task->fresh()->category_id)->toBeNull();
});
