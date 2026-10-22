<?php

namespace App\Http\Controllers;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('dashboard', [
            'stats' => [
                'total' => $user->tasks()->count(),
                'by_status' => [
                    'todo' => $user->tasks()->where('status', TaskStatus::Todo->value)->count(),
                    'in_progress' => $user->tasks()->where('status', TaskStatus::InProgress->value)->count(),
                    'done' => $user->tasks()->where('status', TaskStatus::Done->value)->count(),
                ],
                'by_priority' => [
                    'low' => $user->tasks()->where('priority', TaskPriority::Low->value)->count(),
                    'medium' => $user->tasks()->where('priority', TaskPriority::Medium->value)->count(),
                    'high' => $user->tasks()->where('priority', TaskPriority::High->value)->count(),
                ],
                'overdue' => $user->tasks()
                    ->where('due_date', '<', today())
                    ->where('status', '!=', TaskStatus::Done->value)
                    ->count(),
                'due_this_week' => $user->tasks()
                    ->whereBetween('due_date', [today(), today()->endOfWeek()])
                    ->where('status', '!=', TaskStatus::Done->value)
                    ->count(),
            ],
            'recent_tasks' => $user->tasks()
                ->with('category:id,name,color')
                ->latest('updated_at')
                ->limit(5)
                ->get(),
        ]);
    }
}
