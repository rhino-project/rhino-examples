# frozen_string_literal: true

class CreateLabels < ActiveRecord::Migration[8.0]
  def change
    create_table :labels do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false
      t.string :color
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :labels, :discarded_at
  end
end
