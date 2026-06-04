# frozen_string_literal: true

module AuthHelpers
  def seed_roles
    @roles = {}
    %w[owner admin manager member viewer].each do |slug|
      @roles[slug] = Role.find_or_create_by!(slug: slug) do |r|
        r.name = slug.capitalize
        r.description = "#{slug.capitalize} role"
      end
    end
    @roles
  end

  def create_user_in_org(role_slug, org, permissions: ["*"])
    user = create(:user)
    role = Role.find_by!(slug: role_slug)

    UserRole.create!(
      user_id: user.id,
      role_id: role.id,
      organization_id: org.id,
      permissions: permissions
    )

    user
  end

  def auth_headers(user)
    token = user.api_token || user.regenerate_api_token
    { "Authorization" => "Bearer #{user.api_token}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers
end
