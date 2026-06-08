# frozen_string_literal: true

# ---------------------------------------------------------------
# 1. Roles
# ---------------------------------------------------------------
roles = {}
%w[owner admin manager member viewer].each do |slug|
  roles[slug] = Role.find_or_create_by!(slug: slug) do |r|
    r.name = slug.capitalize
    r.description = "#{slug.capitalize} role"
  end
end

# ---------------------------------------------------------------
# 2. Organizations
# ---------------------------------------------------------------
acme = Organization.find_or_create_by!(slug: "acme-corp") do |o|
  o.name = "Acme Corp"
  o.description = "A leading provider of everything."
  o.is_active = true
end

globex = Organization.find_or_create_by!(slug: "globex-inc") do |o|
  o.name = "Globex Inc"
  o.description = "Global excellence in innovation."
  o.is_active = true
end

# ---------------------------------------------------------------
# 3. Users
# ---------------------------------------------------------------
alice = User.find_or_create_by!(email: "alice@acme.com") do |u|
  u.name = "Alice Johnson"
  u.password = "password"
end

bob = User.find_or_create_by!(email: "bob@acme.com") do |u|
  u.name = "Bob Smith"
  u.password = "password"
end

carol = User.find_or_create_by!(email: "carol@acme.com") do |u|
  u.name = "Carol Williams"
  u.password = "password"
end

dave = User.find_or_create_by!(email: "dave@acme.com") do |u|
  u.name = "Dave Brown"
  u.password = "password"
end

eve = User.find_or_create_by!(email: "eve@globex.com") do |u|
  u.name = "Eve Davis"
  u.password = "password"
end

# ---------------------------------------------------------------
# 4. Layered permissions (Rhino 4.3)
#
# Role permissions are defined ONCE per (organization, role) in the
# org_role_permissions "role layer". Each user_roles row then carries only its
# personal delta: granted_permissions (extra abilities) and denied_permissions
# (carve-outs). Effective = (role ∪ granted) − denied, and deny always wins.
# ---------------------------------------------------------------
manager_layer = [
  "projects.index", "projects.show", "projects.store", "projects.update",
  "tasks.index", "tasks.show", "tasks.store", "tasks.update",
  "comments.index", "comments.show", "comments.store", "comments.update", "comments.destroy",
  "labels.index", "labels.show", "labels.store", "labels.update"
]
member_layer = [
  "projects.index", "projects.show",
  "tasks.index", "tasks.show", "tasks.update",
  "comments.index", "comments.show", "comments.store", "comments.update",
  "labels.index", "labels.show"
]
viewer_layer = [
  "projects.index", "projects.show",
  "tasks.index", "tasks.show",
  "comments.index", "comments.show",
  "labels.index", "labels.show"
]

# Shared role layer for Acme — one row per role, inherited by every member.
{
  roles["admin"].id => ["*"],
  roles["manager"].id => manager_layer,
  roles["member"].id => member_layer,
  roles["viewer"].id => viewer_layer
}.each do |role_id, permissions|
  orp = OrgRolePermission.find_or_initialize_by(organization_id: acme.id, role_id: role_id)
  orp.permissions = permissions
  orp.save!
end
# Globex admins share the same wildcard role layer.
OrgRolePermission.find_or_initialize_by(organization_id: globex.id, role_id: roles["admin"].id).tap do |orp|
  orp.permissions = ["*"]
  orp.save!
end

# Helper: assign a role and (re)set the per-user deltas.
assign = lambda do |user, role_id, org_id, granted: [], denied: []|
  ur = UserRole.find_or_initialize_by(user_id: user.id, role_id: role_id, organization_id: org_id)
  ur.permissions = []
  ur.granted_permissions = granted
  ur.denied_permissions = denied
  ur.save!
end

# Alice = admin @ Acme — inherits '*' from the role layer (no deltas).
assign.call(alice, roles["admin"].id, acme.id)

# Bob = manager @ Acme, with a personal DENY: managers can normally delete
# comments, but Bob specifically cannot — deny wins over the role.
assign.call(bob, roles["manager"].id, acme.id, denied: ["comments.destroy"])

# Carol = member @ Acme, with a personal GRANT: members can't normally delete
# comments, but Carol can — granted on top of the role layer (mirror of Bob).
assign.call(carol, roles["member"].id, acme.id, granted: ["comments.destroy"])

# Dave = viewer @ Acme — read-only, straight from the role layer.
assign.call(dave, roles["viewer"].id, acme.id)

# Eve = admin @ Globex — inherits '*' from Globex's role layer.
assign.call(eve, roles["admin"].id, globex.id)

# ---------------------------------------------------------------
# 5. Projects
# ---------------------------------------------------------------
website_redesign = Project.find_or_create_by!(
  title: "Website Redesign",
  organization_id: acme.id
) do |p|
  p.description = "Complete overhaul of the company website with modern design."
  p.status = "active"
  p.budget = 50_000.00
  p.internal_notes = "Priority project for Q2. CEO is personally involved."
  p.starts_at = "2026-01-15"
  p.ends_at = "2026-06-30"
end

mobile_app = Project.find_or_create_by!(
  title: "Mobile App MVP",
  organization_id: acme.id
) do |p|
  p.description = "Build the first version of our mobile application."
  p.status = "draft"
  p.budget = 120_000.00
  p.internal_notes = "Awaiting final approval from the board."
  p.starts_at = "2026-04-01"
  p.ends_at = "2026-12-31"
end

api_integration = Project.find_or_create_by!(
  title: "API Integration",
  organization_id: acme.id
) do |p|
  p.description = "Integrate with third-party payment and shipping APIs."
  p.status = "active"
  p.budget = 30_000.00
  p.internal_notes = nil
  p.starts_at = "2026-02-01"
  p.ends_at = "2026-05-15"
end

# ---------------------------------------------------------------
# 6. Tasks
# ---------------------------------------------------------------
task1 = Task.find_or_create_by!(
  title: "Design homepage mockup",
  project_id: website_redesign.id
) do |t|
  t.description = "Create high-fidelity mockup for the new homepage."
  t.status = "in_progress"
  t.priority = "high"
  t.estimated_hours = 16.00
  t.due_date = "2026-02-28"
  t.assignee_id = carol.id
end

task2 = Task.find_or_create_by!(
  title: "Set up CI/CD pipeline",
  project_id: website_redesign.id
) do |t|
  t.description = "Configure GitHub Actions for automated testing and deployment."
  t.status = "todo"
  t.priority = "medium"
  t.estimated_hours = 8.00
  t.due_date = "2026-03-15"
  t.assignee_id = bob.id
end

task3 = Task.find_or_create_by!(
  title: "Research payment gateways",
  project_id: api_integration.id
) do |t|
  t.description = "Evaluate Stripe, PayPal, and local payment options."
  t.status = "done"
  t.priority = "high"
  t.estimated_hours = 4.00
  t.due_date = "2026-02-15"
  t.assignee_id = alice.id
end

task4 = Task.find_or_create_by!(
  title: "Write user stories",
  project_id: mobile_app.id
) do |t|
  t.description = "Document all user stories for the mobile app MVP scope."
  t.status = "todo"
  t.priority = "low"
  t.estimated_hours = 12.00
  t.due_date = "2026-04-30"
  t.assignee_id = bob.id
end

# ---------------------------------------------------------------
# 7. Labels
# ---------------------------------------------------------------
label_bug = Label.find_or_create_by!(name: "bug", organization_id: acme.id) do |l|
  l.color = "#e11d48"
end

label_feature = Label.find_or_create_by!(name: "feature", organization_id: acme.id) do |l|
  l.color = "#2563eb"
end

label_urgent = Label.find_or_create_by!(name: "urgent", organization_id: acme.id) do |l|
  l.color = "#f59e0b"
end

label_docs = Label.find_or_create_by!(name: "documentation", organization_id: acme.id) do |l|
  l.color = "#10b981"
end

# Attach labels to tasks
task1.labels << label_feature unless task1.labels.include?(label_feature)
task2.labels << label_feature unless task2.labels.include?(label_feature)
task2.labels << label_urgent unless task2.labels.include?(label_urgent)
task3.labels << label_docs unless task3.labels.include?(label_docs)

# ---------------------------------------------------------------
# 8. Comments
# ---------------------------------------------------------------
Comment.find_or_create_by!(
  body: "Looking great so far! Let me know when the first draft is ready.",
  task_id: task1.id,
  user_id: alice.id
)

Comment.find_or_create_by!(
  body: "I will have the mockup ready by Friday.",
  task_id: task1.id,
  user_id: carol.id
)

Comment.find_or_create_by!(
  body: "Stripe seems like the best option for our use case.",
  task_id: task3.id,
  user_id: alice.id
)

puts "Seed data created successfully!"
