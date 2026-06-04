# frozen_string_literal: true

# Hybrid seeds (GROUP_AUTH_DESIGN.md, enforce_group_membership = ON).
#
# Seeds three isolated audiences:
#   - an agency org (acme) + an agency member  (route_group = 'agency')
#   - a vendor org (globex) + a vendor member  (route_group = 'vendor', distinct user)
#   - a personal user (route_group = 'personal', org-less) who owns PersonalProjects
#
# Memberships are keyed by (user, route_group, organization, role), so the agency
# member is NOT a member of the vendor group (and vice versa) -> 403 cross-group.

# ---------------------------------------------------------------
# Roles
# ---------------------------------------------------------------
roles = {}
%w[owner admin manager member viewer].each do |slug|
  roles[slug] = Role.find_or_create_by!(slug: slug) do |r|
    r.name = slug.capitalize
    r.description = "#{slug.capitalize} role"
  end
end

# ---------------------------------------------------------------
# Agency org + agency member
# ---------------------------------------------------------------
acme = Organization.find_or_create_by!(slug: "acme") do |o|
  o.name = "Acme Agency"
  o.description = "Agency org"
  o.is_active = true
end

agency_user = User.find_or_create_by!(email: "agency@acme.com") do |u|
  u.name = "Agency Annie"
  u.password = "password"
end

UserRole.find_or_create_by!(
  user_id: agency_user.id,
  role_id: roles["admin"].id,
  organization_id: acme.id,
  route_group: "agency"
) { |ur| ur.permissions = ["*"] }

acme_project = Project.find_or_create_by!(title: "Acme Campaign", organization_id: acme.id) do |p|
  p.description = "Agency campaign work."
  p.status = "active"
  p.budget = 25_000.00
end

Task.find_or_create_by!(title: "Draft creative brief", project_id: acme_project.id) do |t|
  t.status = "in_progress"
  t.priority = "high"
  t.assignee_id = agency_user.id
end

# ---------------------------------------------------------------
# Vendor org + vendor member (DISTINCT user, distinct group)
# ---------------------------------------------------------------
globex = Organization.find_or_create_by!(slug: "globex") do |o|
  o.name = "Globex Vendor"
  o.description = "Vendor org"
  o.is_active = true
end

vendor_user = User.find_or_create_by!(email: "vendor@globex.com") do |u|
  u.name = "Vendor Vince"
  u.password = "password"
end

UserRole.find_or_create_by!(
  user_id: vendor_user.id,
  role_id: roles["admin"].id,
  organization_id: globex.id,
  route_group: "vendor"
) { |ur| ur.permissions = ["*"] }

globex_project = Project.find_or_create_by!(title: "Globex Supply", organization_id: globex.id) do |p|
  p.description = "Vendor supply work."
  p.status = "active"
  p.budget = 40_000.00
end

Task.find_or_create_by!(title: "Confirm SKUs", project_id: globex_project.id) do |t|
  t.status = "todo"
  t.priority = "medium"
  t.assignee_id = vendor_user.id
end

# ---------------------------------------------------------------
# Personal user (org-less, route_group = 'personal')
# ---------------------------------------------------------------
personal_user = User.find_or_create_by!(email: "personal@example.com") do |u|
  u.name = "Personal Pat"
  u.password = "password"
end

UserRole.find_or_create_by!(
  user_id: personal_user.id,
  role_id: roles["owner"].id,
  organization_id: nil,
  route_group: "personal"
) { |ur| ur.permissions = ["personal-projects.*"] }

PersonalProject.find_or_create_by!(title: "My Side Hustle", user_id: personal_user.id) do |p|
  p.description = "A private personal project."
  p.status = "active"
end

puts "Seed data created successfully!"
puts "  agency@acme.com   -> agency group on acme.agency.lvh.me"
puts "  vendor@globex.com -> vendor group on globex.vendor.lvh.me"
puts "  personal@example.com -> personal group on app.lvh.me"
puts "  (all passwords: password)"
