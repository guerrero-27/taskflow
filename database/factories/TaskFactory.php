<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => null,
            'title' => fake()->sentence(4, false),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(TaskStatus::cases()),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'due_date' => fake()->optional()->dateTimeBetween('-1 week', '+2 weeks'),
        ];
    }

    public function todo(): static
    {
        return $this->state(['status' => TaskStatus::Todo]);
    }

    public function inProgress(): static
    {
        return $this->state(['status' => TaskStatus::InProgress]);
    }

    public function done(): static
    {
        return $this->state(['status' => TaskStatus::Done]);
    }

    public function overdue(): static
    {
        return $this->state([
            'status' => TaskStatus::Todo,
            'due_date' => now()->subDays(3)->toDateString(),
        ]);
    }
}
