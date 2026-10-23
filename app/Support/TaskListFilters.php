<?php

namespace App\Support;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * The validated filter, sort, and page state of the Tasks list.
 *
 * Built from untrusted input (the request query or a referer's query string).
 * Invalid, malformed, or array values are dropped rather than rejected, so a bad
 * bookmark or hand-edited URL degrades to the unfiltered list instead of an error.
 */
final readonly class TaskListFilters
{
    public const SORTABLE = ['created_at', 'updated_at', 'due_date', 'title', 'priority', 'status'];

    public const DUE_FILTERS = ['overdue', 'today', 'this_week', 'no_due'];

    /** Keys exposed to the frontend as the `filters` prop. */
    private const FILTER_KEYS = ['search', 'status', 'priority', 'category_id', 'due', 'sort', 'direction'];

    private const DEFAULT_SORT = 'created_at';

    private const DEFAULT_DIRECTION = 'desc';

    /**
     * @param  array<string, string>  $values  Valid, non-empty filter values as given in the query.
     */
    private function __construct(
        private array $values,
        public ?int $page,
        public ?string $search,
        public ?string $status,
        public ?string $priority,
        public ?int $categoryId,
        public ?string $due,
        public string $sort,
        public string $direction,
    ) {}

    /**
     * @param  array<array-key, mixed>  $input
     */
    public static function fromInput(array $input): self
    {
        $input = Arr::only($input, [...self::FILTER_KEYS, 'page']);

        if (is_string($input['search'] ?? null)) {
            $input['search'] = trim($input['search']);
        }

        $valid = Validator::make($input, [
            'search' => ['string', 'max:255'],
            'status' => ['string', Rule::enum(TaskStatus::class)],
            'priority' => ['string', Rule::enum(TaskPriority::class)],
            'category_id' => ['string', 'regex:/^[1-9][0-9]{0,17}$/'],
            'due' => ['string', Rule::in(self::DUE_FILTERS)],
            'sort' => ['string', Rule::in(self::SORTABLE)],
            'direction' => ['string', Rule::in(['asc', 'desc'])],
            'page' => ['regex:/^[1-9][0-9]{0,8}$/'],
        ])->valid();

        $page = isset($valid['page']) ? (int) $valid['page'] : null;

        $values = array_filter(
            Arr::only($valid, self::FILTER_KEYS),
            fn ($value) => is_string($value) && $value !== '',
        );

        return new self(
            values: $values,
            page: $page > 1 ? $page : null,
            search: $values['search'] ?? null,
            status: $values['status'] ?? null,
            priority: $values['priority'] ?? null,
            categoryId: isset($values['category_id']) ? (int) $values['category_id'] : null,
            due: $values['due'] ?? null,
            sort: $values['sort'] ?? self::DEFAULT_SORT,
            direction: $values['direction'] ?? self::DEFAULT_DIRECTION,
        );
    }

    public function withPage(?int $page): self
    {
        return new self(
            ...[...get_object_vars($this), 'page' => $page !== null && $page > 1 ? $page : null],
        );
    }

    /**
     * Every filter key, with null for unset ones, for the frontend `filters` prop.
     *
     * Values stay strings exactly as given in the URL, so they match select option values.
     *
     * @return array<string, string|null>
     */
    public function toProps(): array
    {
        return array_merge(array_fill_keys(self::FILTER_KEYS, null), $this->values);
    }

    /**
     * Only the set filters plus the page, for building Tasks list URLs.
     *
     * @return array<string, string|int>
     */
    public function toQuery(): array
    {
        return $this->page === null ? $this->values : [...$this->values, 'page' => $this->page];
    }
}
