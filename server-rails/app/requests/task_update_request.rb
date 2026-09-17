# frozen_string_literal: true

# Validation for PUT /api/{organization}/tasks/{hash_id}.
#
# Found by CONVENTION, exactly like TaskStoreRequest. Note that discovery is
# per action: if this file were deleted, store would keep using
# TaskStoreRequest and update would fall back to the deprecated model-level
# validations.
#
# There is no `authorize?` here on purpose: the store class refuses managers,
# this one does not, which shows that the two actions are independent.
#
# Try it:
#
#   # Alice sends estimated_hours (TaskPolicy permits it) — 200, but the column
#   # is UNCHANGED: this class declares no `attribute :estimated_hours`, so the
#   # field is dropped from the write payload. Fail closed.
#   curl -X PUT .../api/acme-corp/tasks/$HASH -H "Authorization: Bearer $ALICE" \
#        -d '{"estimated_hours":"99"}'
#
#   # Reopening a done task — 422
#   #   {"errors":{"status":["cannot be reopened once the task is done"]}}
class TaskUpdateRequest < Rhino::ResourceRequest
  attribute :title, :string
  attribute :description, :string
  attribute :status, :string
  attribute :priority, :string
  attribute :due_date, :date
  attribute :project_id, :integer
  attribute :assignee_id, :integer
  # `estimated_hours` is deliberately NOT declared: the policy lets an admin
  # write it, and it is still dropped. Declared attributes are the payload.

  # Nothing is required — an update writes only the declared attributes actually
  # present in the request. Unlike the deprecated model-level path, that
  # partial-update behavior is stated here rather than inferred.
  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[todo in_progress in_review done] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high critical] }, allow_nil: true
  validates :project_id, numericality: { only_integer: true }, allow_nil: true

  # `attribute :title, :string` casts ANY value to a String, so {"title":["x"]}
  # would otherwise persist the literal '["x"]'. The shape is checked against
  # the RAW input. There is no `prepare` on this class, so there is no string
  # manipulation to guard — but the same rule applies if one is added: guard
  # every string operation with is_a?(String) and leave anything else for the
  # validations to reject.
  validate :title_must_be_text

  # A rule that depends on the record's CURRENT state. `record` is the
  # organization-scoped row as it exists BEFORE this update is applied, which is
  # something model-level validations cannot see.
  validate :done_tasks_may_not_be_reopened

  private

  def title_must_be_text
    return if input["title"].nil? || input["title"].is_a?(String)

    errors.add(:title, "must be a string")
  end

  def done_tasks_may_not_be_reopened
    return if record.nil? || status.nil?
    return unless record.status == "done" && status != "done"

    errors.add(:status, "cannot be reopened once the task is done")
  end
end
