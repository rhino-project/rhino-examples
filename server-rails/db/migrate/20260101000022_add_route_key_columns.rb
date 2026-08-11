# frozen_string_literal: true

# Route Key: columns used by rhino_route_key to address records in member
# URLs instead of the numeric primary key.
class AddRouteKeyColumns < ActiveRecord::Migration[8.0]
  def change
    add_column :tasks, :hash_id, :string
    add_index :tasks, :hash_id, unique: true

    add_column :labels, :slug, :string
    add_index :labels, :slug, unique: true
  end
end
