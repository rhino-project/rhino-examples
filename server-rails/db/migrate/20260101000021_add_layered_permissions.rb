# frozen_string_literal: true

class AddLayeredPermissions < ActiveRecord::Migration[8.1]
  def change
    add_column :user_roles, :granted_permissions, :json, default: [] unless column_exists?(:user_roles, :granted_permissions)
    add_column :user_roles, :denied_permissions, :json, default: [] unless column_exists?(:user_roles, :denied_permissions)

    unless table_exists?(:org_role_permissions)
      create_table :org_role_permissions do |t|
        t.references :organization, null: false, foreign_key: true
        t.references :role, null: false, foreign_key: true
        t.json :permissions, default: []
        t.timestamps
      end
      add_index :org_role_permissions, %i[organization_id role_id], unique: true
    end
  end
end
