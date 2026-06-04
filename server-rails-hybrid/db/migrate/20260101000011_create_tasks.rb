# frozen_string_literal: true

class CreateTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :tasks do |t|
      t.references :project, null: false, foreign_key: true
      t.references :assignee, null: true, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "todo"
      t.string :priority, null: false, default: "medium"
      t.decimal :estimated_hours, precision: 8, scale: 2
      t.date :due_date
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :tasks, :discarded_at
  end
end
