# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    sequence(:title) { |n| "Project #{n}" }
    description { "A test project" }
    status { "draft" }
    budget { 10_000.00 }
    association :organization
  end
end
