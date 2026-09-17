<?php

namespace App\Http\Requests;

use Rhino\Http\Requests\ResourceRequest;

/**
 * Validation for PUT /api/{organization}/tasks/{hash_id} (and update operations
 * in POST /api/{organization}/nested).
 *
 * Found by convention — App\Http\Requests\TaskUpdateRequest for App\Models\Task
 * — and takes precedence over the model's own $validationRules.
 *
 * Note what is NOT here: there is no rule for `estimated_hours`, even though
 * the policy permits an admin to send it. A field with no rule is dropped from
 * the write payload, so `PUT {"estimated_hours": 99}` returns 200 with the
 * stored value unchanged. That is the fail-closed half of "what you validate is
 * what gets written" — declare a rule for every field this action should write.
 */
class TaskUpdateRequest extends ResourceRequest
{
    public function prepare(array $input): array
    {
        // Guard the types: prepare() runs BEFORE the rules, so a client can
        // still send {"title": ["a"]} here. Normalize only what is already a
        // string and let the rules reject the rest.
        if (isset($input['title']) && is_string($input['title'])) {
            $input['title'] = trim($input['title']);
        }

        if (isset($input['status']) && is_string($input['status'])) {
            $input['status'] = strtolower($input['status']);
        }

        return $input;
    }

    /**
     * Every rule is `sometimes`: an update class declares its own partial
     * semantics rather than inheriting the legacy path's automatic relaxation.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|min:3|max:255',
            'description' => 'sometimes|nullable|string',

            // Record-dependent rule: record() is the task as it was BEFORE this
            // update, so work that is already finished can only be reopened by
            // someone senior — everyone else may only leave it done.
            'status' => $this->statusRule(),

            'priority' => 'sometimes|string|in:low,medium,high',
            'due_date' => 'sometimes|nullable|date',
            'project_id' => 'sometimes|integer|exists:projects,id',
            'assignee_id' => 'sometimes|nullable|integer|exists:users,id',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.in' => 'A finished task can only be reopened by an owner or admin.',
        ];
    }

    protected function statusRule(): string
    {
        $role = $this->user()?->getRoleSlugForValidation($this->organization());
        $isSenior = in_array($role, ['owner', 'admin'], true);

        if ($this->record()?->status === 'done' && ! $isSenior) {
            return 'sometimes|string|in:done';
        }

        return 'sometimes|string|in:todo,in_progress,done';
    }
}
