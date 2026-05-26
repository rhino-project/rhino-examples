# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_01_000014) do
  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "auditable_id", null: false
    t.string "auditable_type", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.json "new_values"
    t.json "old_values"
    t.bigint "organization_id"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id"
    t.string "user_type"
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable_type_and_auditable_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["organization_id"], name: "index_audit_logs_on_organization_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "comments", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.integer "task_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.string "uuid"
    t.index ["discarded_at"], name: "index_comments_on_discarded_at"
    t.index ["task_id"], name: "index_comments_on_task_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
    t.index ["uuid"], name: "index_comments_on_uuid", unique: true
  end

  create_table "labels", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.string "name", null: false
    t.integer "organization_id", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_labels_on_discarded_at"
    t.index ["organization_id"], name: "index_labels_on_organization_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "is_active", default: true
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "projects", force: :cascade do |t|
    t.decimal "budget", precision: 12, scale: 2
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.date "ends_at"
    t.text "internal_notes"
    t.integer "organization_id", null: false
    t.date "starts_at"
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_projects_on_discarded_at"
    t.index ["organization_id"], name: "index_projects_on_organization_id"
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_roles_on_slug", unique: true
  end

  create_table "task_labels", force: :cascade do |t|
    t.datetime "created_at"
    t.integer "label_id", null: false
    t.integer "task_id", null: false
    t.index ["label_id"], name: "index_task_labels_on_label_id"
    t.index ["task_id", "label_id"], name: "index_task_labels_on_task_id_and_label_id", unique: true
    t.index ["task_id"], name: "index_task_labels_on_task_id"
  end

  create_table "tasks", force: :cascade do |t|
    t.integer "assignee_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.date "due_date"
    t.decimal "estimated_hours", precision: 8, scale: 2
    t.string "priority", default: "medium", null: false
    t.integer "project_id", null: false
    t.string "status", default: "todo", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_tasks_on_assignee_id"
    t.index ["discarded_at"], name: "index_tasks_on_discarded_at"
    t.index ["project_id"], name: "index_tasks_on_project_id"
  end

  create_table "user_roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "organization_id", null: false
    t.json "permissions", default: []
    t.integer "role_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["organization_id"], name: "index_user_roles_on_organization_id"
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["user_id", "organization_id"], name: "index_user_roles_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "api_token"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "comments", "tasks"
  add_foreign_key "comments", "users"
  add_foreign_key "labels", "organizations"
  add_foreign_key "projects", "organizations"
  add_foreign_key "task_labels", "labels"
  add_foreign_key "task_labels", "tasks"
  add_foreign_key "tasks", "projects"
  add_foreign_key "tasks", "users", column: "assignee_id"
  add_foreign_key "user_roles", "organizations"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "users"
end
