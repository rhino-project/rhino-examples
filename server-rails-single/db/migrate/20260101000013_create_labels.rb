# frozen_string_literal: true

class CreateLabels < ActiveRecord::Migration[8.0]
  def change
    # Labels are a SHARED GLOBAL catalog in the single-tenant variant: no owner
    # (no organization_id / user_id). Every user sees the same label set.
    create_table :labels do |t|
      t.string :name, null: false
      t.string :color
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :labels, :discarded_at
  end
end
