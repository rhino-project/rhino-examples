# frozen_string_literal: true

# Single-tenant seeds.
#
# Two plain users, each OWNING their own projects (and tasks/comments via the
# project). A shared GLOBAL Label catalog with no owner — visible to everyone.

# ---------------------------------------------------------------
# 1. Users
# ---------------------------------------------------------------
alice = User.find_or_create_by!(email: "alice@example.com") do |u|
  u.name = "Alice Johnson"
  u.password = "password"
end

bob = User.find_or_create_by!(email: "bob@example.com") do |u|
  u.name = "Bob Smith"
  u.password = "password"
end

# ---------------------------------------------------------------
# 2. Shared GLOBAL Label catalog (no owner)
# ---------------------------------------------------------------
label_bug = Label.find_or_create_by!(name: "bug") { |l| l.color = "#e11d48" }
label_feature = Label.find_or_create_by!(name: "feature") { |l| l.color = "#2563eb" }
label_urgent = Label.find_or_create_by!(name: "urgent") { |l| l.color = "#f59e0b" }
Label.find_or_create_by!(name: "documentation") { |l| l.color = "#10b981" }

# ---------------------------------------------------------------
# 3. Alice's projects / tasks / comments
# ---------------------------------------------------------------
alice_site = Project.find_or_create_by!(title: "Website Redesign", user_id: alice.id) do |p|
  p.description = "Complete overhaul of the company website with modern design."
  p.status = "active"
  p.budget = 50_000.00
  p.internal_notes = "Priority project for Q2."
  p.starts_at = "2026-01-15"
  p.ends_at = "2026-06-30"
end

alice_api = Project.find_or_create_by!(title: "API Integration", user_id: alice.id) do |p|
  p.description = "Integrate with third-party payment and shipping APIs."
  p.status = "active"
  p.budget = 30_000.00
  p.starts_at = "2026-02-01"
  p.ends_at = "2026-05-15"
end

alice_task1 = Task.find_or_create_by!(title: "Design homepage mockup", project_id: alice_site.id) do |t|
  t.description = "Create high-fidelity mockup for the new homepage."
  t.status = "in_progress"
  t.priority = "high"
  t.estimated_hours = 16.00
  t.due_date = "2026-02-28"
  t.assignee_id = alice.id
end

alice_task2 = Task.find_or_create_by!(title: "Research payment gateways", project_id: alice_api.id) do |t|
  t.description = "Evaluate Stripe, PayPal, and local payment options."
  t.status = "done"
  t.priority = "high"
  t.estimated_hours = 4.00
  t.due_date = "2026-02-15"
  t.assignee_id = alice.id
end

alice_task1.labels << label_feature unless alice_task1.labels.include?(label_feature)
alice_task2.labels << label_urgent unless alice_task2.labels.include?(label_urgent)

Comment.find_or_create_by!(body: "Looking great so far!", task_id: alice_task1.id, user_id: alice.id)

# ---------------------------------------------------------------
# 4. Bob's projects / tasks / comments
# ---------------------------------------------------------------
bob_app = Project.find_or_create_by!(title: "Mobile App MVP", user_id: bob.id) do |p|
  p.description = "Build the first version of our mobile application."
  p.status = "draft"
  p.budget = 120_000.00
  p.internal_notes = "Awaiting final approval."
  p.starts_at = "2026-04-01"
  p.ends_at = "2026-12-31"
end

bob_task = Task.find_or_create_by!(title: "Write user stories", project_id: bob_app.id) do |t|
  t.description = "Document all user stories for the mobile app MVP scope."
  t.status = "todo"
  t.priority = "low"
  t.estimated_hours = 12.00
  t.due_date = "2026-04-30"
  t.assignee_id = bob.id
end

bob_task.labels << label_bug unless bob_task.labels.include?(label_bug)

Comment.find_or_create_by!(body: "I'll start on these this week.", task_id: bob_task.id, user_id: bob.id)

puts "Seed data created successfully!"
puts "  Users: alice@example.com / bob@example.com (password: password)"
puts "  Alice owns #{Project.unscoped.where(user_id: alice.id).count} projects; " \
     "Bob owns #{Project.unscoped.where(user_id: bob.id).count}."
puts "  Shared global labels: #{Label.count}"
