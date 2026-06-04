# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Soft Deletes", type: :request do
  before do
    seed_roles
    @org = create(:organization)
  end

  it "admin can view trashed projects" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id)
    project.discard!

    get "/api/#{@org.slug}/projects/trashed", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    items = json["data"] || json
    expect(items.length).to eq(1)
  end

  it "admin can restore a soft-deleted project" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id)
    project.discard!

    post "/api/#{@org.slug}/projects/#{project.id}/restore", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    expect(Project.kept.find_by(id: project.id)).not_to be_nil
  end

  it "admin can force-delete a project" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id)
    project.discard!

    delete "/api/#{@org.slug}/projects/#{project.id}/force-delete", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:no_content)
    expect(Project.with_discarded.find_by(id: project.id)).to be_nil
  end

  it "viewer cannot restore a project" do
    viewer = create_user_in_org("viewer", @org, permissions: %w[projects.index projects.show])
    project = create(:project, organization_id: @org.id)
    project.discard!

    post "/api/#{@org.slug}/projects/#{project.id}/restore", headers: auth_headers(viewer), as: :json

    expect(response).to have_http_status(:forbidden)
  end
end
