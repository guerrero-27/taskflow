<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Task;
use App\Support\TaskListFilters;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $filters = TaskListFilters::fromInput($request->query());

        $tasks = $request->user()
            ->tasks()
            ->with('category:id,name,color')
            ->filter($filters)
            ->paginate(15)
            ->appends($filters->withPage(null)->toQuery());

        // A page beyond the end (e.g. after deleting the last task on the last page)
        // falls back to the last page that still has results.
        if ($tasks->currentPage() > $tasks->lastPage()) {
            return to_route('tasks.index', $filters->withPage($tasks->lastPage())->toQuery());
        }

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'categories' => $request->user()->categories()->orderBy('name')->get(['id', 'name', 'color']),
            'filters' => $filters->toProps(),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $request->user()->tasks()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task created.')]);

        return $this->redirectToList($request, keepPage: false);
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $task->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task updated.')]);

        return $this->redirectToList($request);
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task deleted.')]);

        return $this->redirectToList($request);
    }

    /**
     * Redirect back to the Tasks list the mutation was made from, keeping its filters.
     *
     * Only the query string of a same-origin Tasks index referer is used; the redirect
     * target is always the tasks.index route, never the referer URL itself.
     */
    private function redirectToList(Request $request, bool $keepPage = true): RedirectResponse
    {
        $query = [];
        $referer = (string) $request->headers->get('referer');

        if (strtok($referer, '?#') === route('tasks.index')) {
            parse_str((string) parse_url($referer, PHP_URL_QUERY), $query);
        }

        $filters = TaskListFilters::fromInput($query);

        if (! $keepPage) {
            $filters = $filters->withPage(null);
        }

        return to_route('tasks.index', $filters->toQuery());
    }
}
