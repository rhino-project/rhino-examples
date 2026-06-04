# frozen_string_literal: true

FactoryBot.define do
  factory :label do
    sequence(:name) { |n| "label-#{n}" }
    color { "#ff0000" }
    association :organization
  end
end
