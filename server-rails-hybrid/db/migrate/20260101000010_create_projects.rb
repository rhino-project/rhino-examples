# frozen_string_literal: true

class CreateProjects < ActiveRecord::Migration[8.0]
  def change
    create_table :projects do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "draft"
      t.decimal :budget, precision: 12, scale: 2
      t.text :internal_notes
      t.date :starts_at
      t.date :ends_at
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :projects, :discarded_at
  end
end
