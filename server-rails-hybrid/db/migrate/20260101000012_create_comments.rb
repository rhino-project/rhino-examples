# frozen_string_literal: true

class CreateComments < ActiveRecord::Migration[8.0]
  def change
    create_table :comments do |t|
      t.string :uuid
      t.references :task, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :body, null: false
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :comments, :uuid, unique: true
    add_index :comments, :discarded_at
  end
end
