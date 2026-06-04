# frozen_string_literal: true

FactoryBot.define do
  factory :comment do
    body { "A test comment" }
    association :task
    association :user
  end
end
