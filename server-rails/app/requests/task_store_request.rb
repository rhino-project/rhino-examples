# frozen_string_literal: true

# Validation for POST /api/{organization}/tasks.
#
# Found by CONVENTION: Rhino looks for "{Model}StoreRequest" on every store
# action, so this file needs no registration at all — app/requests is autoloaded
# by Zeitwerk like every other app/* directory.
#
# Task also still declares `validates :title/:status/:priority` on the model.
# Those model-level rules are DEPRECATED and are deliberately left in place here
# to demonstrate precedence: while this class exists, the model's rules are not
# consulted for the store action at all.
#
# Try it (seeded users, password "password", tokens from POST /api/auth/login):
#
#   # Alice (admin @ acme-corp) — 201
#   curl -X POST .../api/acme-corp/tasks -H "Authorization: Bearer $ALICE" \
#        -d '{"title":"  Ship it  ","project_id":1,"priority":"high"}'
#
#   # Bob (manager @ acme-corp) — 403 {"message":"This action is unauthorized."}
#   curl -X POST .../api/acme-corp/tasks -H "Authorization: Bearer $BOB" ...
#
#   # bad status — 422 {"errors":{"status":["is not included in the list"]}}
#   # project_id owned by globex-inc — 422
#   #   {"errors":{"project_id":["does not belong to your organization"]}}
class TaskStoreRequest < Rhino::ResourceRequest
  # These declared attributes ARE the write payload. A field the policy permits
  # but that is not declared here is silently dropped, never persisted.
  attribute :title, :string
  attribute :description, :string
  attribute :status, :string
  attribute :priority, :string
  attribute :estimated_hours, :decimal
  attribute :due_date, :date
  attribute :project_id, :integer
  attribute :assignee_id, :integer
  # Not client-writable (TaskPolicy#permitted_attributes_for_create omits it) —
  # it is filled in by prepare below. Declared so that value gets persisted.
  attribute :hash_id, :string

  validates :title, presence: true, length: { maximum: 255 }
  validates :project_id, presence: true, numericality: { only_integer: true }
  validates :status, inclusion: { in: %w[todo in_progress in_review done] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high critical] }, allow_nil: true
  validates :estimated_hours,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1000 },
            allow_nil: true

  # `attribute :title, :string` casts ANY value to a String, so a client sending
  # {"title": ["x"]} would otherwise persist the literal '["x"]' and sail past
  # presence/length. The shape is therefore checked against the RAW input.
  validate :title_must_be_text

  # Only a manager is refused here. Alice (admin @ acme-corp) and Eve (admin @
  # globex-inc) pass; Bob (manager @ acme-corp, and the only seeded user who
  # holds "tasks.store" WITHOUT being an admin) gets a 403 whose body is
  # byte-identical to a policy denial — see db/seeds.rb.
  #
  # Carol (member) and Dave (viewer) never reach this point: they have no
  # "tasks.store" permission, so the policy gate refuses them first, with the
  # same body. That is the point — `authorize?` leaks nothing.
  def authorize?
    return false if user.nil?

    user.role_slug_for_validation(organization) != "manager"
  end

  # Runs BEFORE authorize?, and AFTER the policy's forbidden-field check — so a
  # client cannot use it to smuggle a denied field through, and everything it
  # adds is server-authored.
  #
  # Note `hash_id` is generated, never read from `input`. Copying a client value
  # into a key the policy denies is exactly the mistake this hook makes easy.
  #
  # It also runs BEFORE the validations, so it sees RAW client input: `title`
  # may be an Array, a Hash or a number. Every string operation is guarded with
  # is_a?(String) and anything else is left untouched, so `title_must_be_text`
  # rejects it with a 422 instead of prepare mangling it into something valid.
  def prepare(input)
    title = input["title"]
    status = input["status"]

    input.merge(
      "title" => title.is_a?(String) ? title.strip : title,
      # blank? is total (it answers for any object), so no guard is needed here;
      # a non-blank non-String status flows through to the inclusion rule.
      "status" => status.blank? ? "todo" : status,
      "hash_id" => SecureRandom.hex(6)
    )
  end

  private

  def title_must_be_text
    return if input["title"].nil? || input["title"].is_a?(String)

    errors.add(:title, "must be a string")
  end
end
