<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    private const SORTABLE = ['created_at', 'updated_at', 'due_date', 'title', 'priority', 'status'];

    public function index(Request $request): Response
    {
        $sort = in_array($request->sort, self::SORTABLE) ? $request->sort : 'created_at';
        $direction = $request->direction === 'asc' ? 'asc' : 'desc';

        $tasks = $request->user()
            ->tasks()
            ->with('category:id,name,color')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->search.'%';
                $q->where(fn ($q) => $q
                    ->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                );
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->priority))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', (int) $request->category_id))
            ->when($request->filled('due'), fn ($q) => match ($request->due) {
                'overdue' => $q->where('due_date', '<', today())->where('status', '!=', TaskStatus::Done->value),
                'today' => $q->whereDate('due_date', today()),
                'this_week' => $q->whereBetween('due_date', [today(), today()->endOfWeek()]),
                'no_due' => $q->whereNull('due_date'),
                default => $q,
            })
            ->orderBy($sort, $direction)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'color']),
            'filters' => $request->only(['search', 'status', 'priority', 'category_id', 'due', 'sort', 'direction']),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('tasks/create', [
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $request->user()->tasks()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task created.')]);

        return to_route('tasks.index');
    }

    public function edit(Request $request, Task $task): Response
    {
        $this->authorize('update', $task);

        return Inertia::render('tasks/edit', [
            'task' => $task->load('category:id,name,color'),
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $task->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task updated.')]);

        return to_route('tasks.index');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task deleted.')]);

        return to_route('tasks.index');
    }
}
