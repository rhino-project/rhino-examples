# frozen_string_literal: true

# The job / rake-task case. There is no request here, so no route group resolves
# and a bare Rhino.query has nothing to go on — it fails closed, as it should.
#
# A back-office job says which group it is acting as with in_route_group. The
# group's own `tenant: false` in config/initializers/rhino.rb is what actually
# lifts the boundary — naming a tenant group changes nothing.
namespace :admin do
  desc "Count tasks across every organization from a rake task (no request)"
  task task_count: :environment do
    begin
      Rhino.query(Task).count
      abort "LEAKED: a bare Rhino.query in a rake task returned rows"
    rescue Rhino::MissingTenantContext
      puts "bare Rhino.query                   → MissingTenantContext (fail closed)"
    end

    puts "in_route_group(:admin)             → #{Rhino.in_route_group(:admin).query(Task).count} tasks (every organization)"
    puts "in_route_group(:tenant)            → #{probe_tenant_group}"

    org = Organization.find_by(slug: "acme-corp")
    scoped = Rhino.in_route_group(:admin).in_organization(org).query(Task).count
    puts "in_route_group(:admin)+in_org(acme) → #{scoped} tasks (that tenant only)"
  end

  # Naming a tenant group is not a way around the boundary.
  def probe_tenant_group
    "#{Rhino.in_route_group(:tenant).query(Task).count} tasks (LEAKED)"
  rescue Rhino::MissingTenantContext
    "MissingTenantContext (fail closed)"
  end
end
