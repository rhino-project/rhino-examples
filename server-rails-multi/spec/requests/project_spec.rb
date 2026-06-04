# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects", type: :request do
  before do
    seed_roles
    @org = create(:organization)
  end

  # ---------------------------------------------------------------
  # Admin CRUD
  # ---------------------------------------------------------------

  it "admin can list projects" do
    user = create_user_in_org("admin", @org)
    create(:project, organization_id: @org.id)

    get "/api/#{@org.slug}/projects", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    data = json["data"]
    expect(data.length).to eq(1)
  end

  it "admin can create a project" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/projects", params: {
      title: "New Project",
      description: "A test project",
      status: "draft",
      budget: 10_000.00,
      internal_notes: "Secret notes",
      starts_at: "2026-01-01",
      ends_at: "2026-12-31"
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json["title"]).to eq("New Project")
    expect(json["organization_id"]).to eq(@org.id)
  end

  it "admin can update a project" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id)

    put "/api/#{@org.slug}/projects/#{project.id}", params: {
      title: "Updated Title",
      status: project.status
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["title"]).to eq("Updated Title")
  end

  it "admin can delete a project" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id)

    delete "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:no_content)
    expect(Project.kept.find_by(id: project.id)).to be_nil
    expect(Project.with_discarded.find_by(id: project.id)).not_to be_nil
  end

  # ---------------------------------------------------------------
  # Hidden columns
  # ---------------------------------------------------------------

  it "admin sees all fields including budget and internal_notes" do
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: @org.id, budget: 50_000, internal_notes: "Top secret")

    get "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).to have_key("budget")
    expect(json).to have_key("internal_notes")
  end

  it "member cannot see budget or internal_notes" do
    user = create_user_in_org("member", @org, permissions: %w[projects.index projects.show])
    project = create(:project, organization_id: @org.id, budget: 50_000, internal_notes: "Top secret")

    get "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).not_to have_key("budget")
    expect(json).not_to have_key("internal_notes")
    expect(json).to have_key("title")
  end

  it "viewer cannot see budget or internal_notes" do
    user = create_user_in_org("viewer", @org, permissions: %w[projects.index projects.show])
    project = create(:project, organization_id: @org.id, budget: 50_000, internal_notes: "Top secret")

    get "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).not_to have_key("budget")
    expect(json).not_to have_key("internal_notes")
  end

  # ---------------------------------------------------------------
  # Role-keyed validation (forbidden fields)
  # ---------------------------------------------------------------

  it "manager cannot set budget when creating a project" do
    user = create_user_in_org("manager", @org, permissions: %w[projects.index projects.show projects.store projects.update])

    post "/api/#{@org.slug}/projects", params: {
      title: "Manager Project",
      status: "draft",
      budget: 99_999
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  # ---------------------------------------------------------------
  # Member/viewer cannot create/update/delete
  # ---------------------------------------------------------------

  it "member cannot create a project" do
    user = create_user_in_org("member", @org, permissions: %w[projects.index projects.show])

    post "/api/#{@org.slug}/projects", params: { title: "Should Fail" }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  it "viewer cannot delete a project" do
    user = create_user_in_org("viewer", @org, permissions: %w[projects.index projects.show])
    project = create(:project, organization_id: @org.id)

    delete "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  # ---------------------------------------------------------------
  # Cross-org isolation
  # ---------------------------------------------------------------

  it "cannot access projects from another organization" do
    other_org = create(:organization)
    user = create_user_in_org("admin", @org)
    project = create(:project, organization_id: other_org.id)

    get "/api/#{@org.slug}/projects/#{project.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:not_found)
  end

  it "cannot access another organization endpoint" do
    other_org = create(:organization)
    user = create_user_in_org("admin", @org)

    get "/api/#{other_org.slug}/projects", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:not_found)
  end
end
