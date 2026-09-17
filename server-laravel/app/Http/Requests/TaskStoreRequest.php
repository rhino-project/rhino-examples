<?php

namespace App\Http\Requests;

use Rhino\Http\Requests\ResourceRequest;

/**
 * Validation for POST /api/{organization}/tasks (and create operations in
 * POST /api/{organization}/nested).
 *
 * Rhino finds this class by convention — App\Http\Requests\TaskStoreRequest for
 * App\Models\Task — so nothing registers it. It takes precedence over the
 * $validationRules still declared on the Task model, which are deliberately
 * left in place to demonstrate exactly that.
 *
 * What this class validates is what gets written: only keys covered by a rule
 * that passed are persisted.
 */
class TaskStoreRequest extends ResourceRequest
{
    /**
     * Tasks are created by the people who plan the work, not by the people who
     * schedule it: a `manager` is refused here even though the policy lets one
     * call POST /tasks and permits every field it sends.
     *
     * That combination is what makes this the interesting case to try:
     *
     *   bob@acme.com   (manager) → 403 {"message":"This action is unauthorized."}
     *   alice@acme.com (admin)   → 201
     *
     * The 403 body is byte-identical to a policy denial on purpose, so a client
     * cannot tell which gate refused it.
     */
    public function authorize(): bool
    {
        $role = $this->user()?->getRoleSlugForValidation($this->organization());

        return $role !== 'manager';
    }

    /**
     * Normalizes the input before authorize(), the rules and the write payload
     * see it. This runs after the policy's forbidden-field check, so it can
     * never launder a field the policy denied.
     */
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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|min:3|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|in:todo,in_progress,done',
            'priority' => 'required|string|in:low,medium,high',
            'estimated_hours' => 'nullable|numeric|min:0|max:999',
            'due_date' => 'nullable|date',

            // `exists:` is scoped to the current organization automatically —
            // a project_id belonging to another organization is a 422, not a
            // silent cross-tenant write. Do NOT add ',organization_id,N' here.
            'project_id' => 'required|integer|exists:projects,id',

            // Junior roles may not hand a task to someone else on creation.
            'assignee_id' => $this->user()?->getRoleSlugForValidation($this->organization()) === 'member'
                ? 'prohibited'
                : 'nullable|integer|exists:users,id',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Every task needs a title.',
            'status.in' => 'A task is todo, in_progress or done.',
        ];
    }
}
