# frozen_string_literal: true

FactoryBot.define do
  factory :label do
    sequence(:name) { |n| "label-#{n}" }
    # Route Key: labels are addressed by slug in member URLs
    slug { name.parameterize }
    color { "#ff0000" }
    association :organization
  end
end
