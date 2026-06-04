# frozen_string_literal: true

FactoryBot.define do
  factory :organization do
    sequence(:name) { |n| "Organization #{n}" }
    sequence(:slug) { |n| "org-#{n}" }
    description { "A test organization" }
    is_active { true }
  end
end
