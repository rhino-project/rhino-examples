# frozen_string_literal: true

FactoryBot.define do
  factory :task do
    sequence(:title) { |n| "Task #{n}" }
    description { "A test task" }
    status { "todo" }
    priority { "medium" }
    # Route Key: tasks are addressed by hash_id in member URLs
    hash_id { SecureRandom.hex(6) }
    association :project
  end
end
