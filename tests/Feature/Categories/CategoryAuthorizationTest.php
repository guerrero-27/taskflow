<?php

use App\Models\Category;
use App\Models\User;

test('user cannot update another user\'s category', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id, 'name' => 'Original']);

    $this->actingAs($attacker)
        ->patch(route('categories.update', $category), ['name' => 'Hacked', 'color' => null])
        ->assertForbidden();

    expect($category->fresh()->name)->toBe('Original');
});

test('user cannot delete another user\'s category', function () {
    $owner = User::factory()->create();
    $attacker = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($attacker)
        ->delete(route('categories.destroy', $category))
        ->assertForbidden();

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

test('category index only shows own categories', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Category::factory()->create(['user_id' => $userA->id]);
    Category::factory(3)->create(['user_id' => $userB->id]);

    $this->actingAs($userA)
        ->get(route('categories.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('categories', 1));
});
