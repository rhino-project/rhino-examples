# frozen_string_literal: true

# personal_projects — the user-owned model served ONLY by the `personal` route
# group in the hybrid app. It coexists with the org-owned `projects` table used
# by the agency/vendor groups. Ownership is by user_id (no organization).
class CreatePersonalProjects < ActiveRecord::Migration[8.0]
  def change
    create_table :personal_projects do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "draft"
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :personal_projects, :discarded_at
  end
end
