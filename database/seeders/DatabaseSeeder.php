<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@taskflow.test'],
            [
                'name' => 'Admin',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        $this->command->info('');
        $this->command->info('  TaskFlow admin account ready');
        $this->command->info('  Email:    admin@taskflow.test');
        $this->command->info('  Password: password');
        $this->command->info('  URL:      http://TaskFlow.test/dashboard');
        $this->command->info('');
    }
}
