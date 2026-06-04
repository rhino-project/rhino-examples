# frozen_string_literal: true

FactoryBot.define do
  factory :task do
    sequence(:title) { |n| "Task #{n}" }
    description { "A test task" }
    status { "todo" }
    priority { "medium" }
    association :project
  end
end
