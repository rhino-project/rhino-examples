# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tasks", type: :request do
  before do
    seed_roles
    @org = create(:organization)
    @project = create(:project, organization_id: @org.id)
  end

  # ---------------------------------------------------------------
  # Admin CRUD
  # ---------------------------------------------------------------

  it "admin can create a task" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/tasks", params: {
      title: "New Task",
      description: "Do something important",
      status: "todo",
      priority: "high",
      estimated_hours: 8.0,
      project_id: @project.id
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json["title"]).to eq("New Task")
  end

  it "admin can list tasks" do
    user = create_user_in_org("admin", @org)
    create(:task, project_id: @project.id)

    get "/api/#{@org.slug}/tasks", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
  end

  it "admin can update a task" do
    user = create_user_in_org("admin", @org)
    task = create(:task, project_id: @project.id)

    put "/api/#{@org.slug}/tasks/#{task.id}", params: {
      title: "Updated Task",
      status: task.status,
      priority: task.priority,
      project_id: @project.id
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["title"]).to eq("Updated Task")
  end

  it "admin can delete a task" do
    user = create_user_in_org("admin", @org)
    task = create(:task, project_id: @project.id)

    delete "/api/#{@org.slug}/tasks/#{task.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:no_content)
  end

  # ---------------------------------------------------------------
  # TaskScope -- member sees only assigned tasks
  # ---------------------------------------------------------------

  it "member only sees tasks assigned to them" do
    member = create_user_in_org("member", @org, permissions: %w[tasks.index tasks.show tasks.update])

    create(:task, project_id: @project.id, assignee_id: member.id, title: "My Task")
    create(:task, project_id: @project.id, assignee_id: nil, title: "Other Task")

    get "/api/#{@org.slug}/tasks", headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    tasks = json["data"] || json
    task_titles = tasks.map { |t| t["title"] }
    expect(task_titles).to include("My Task")
    expect(task_titles).not_to include("Other Task")
  end

  # ---------------------------------------------------------------
  # Hidden columns -- estimated_hours hidden from member/viewer
  # ---------------------------------------------------------------

  it "admin sees estimated_hours" do
    user = create_user_in_org("admin", @org)
    task = create(:task, project_id: @project.id, estimated_hours: 16.0)

    get "/api/#{@org.slug}/tasks/#{task.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).to have_key("estimated_hours")
  end

  it "member cannot see estimated_hours" do
    member = create_user_in_org("member", @org, permissions: %w[tasks.index tasks.show tasks.update])
    task = create(:task, project_id: @project.id, assignee_id: member.id, estimated_hours: 16.0)

    get "/api/#{@org.slug}/tasks/#{task.id}", headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).not_to have_key("estimated_hours")
  end

  # ---------------------------------------------------------------
  # Member can only update status and description
  # ---------------------------------------------------------------

  it "member can update task status and description" do
    member = create_user_in_org("member", @org, permissions: %w[tasks.index tasks.show tasks.update])
    task = create(:task, project_id: @project.id, assignee_id: member.id, status: "todo", description: "Old description")

    put "/api/#{@org.slug}/tasks/#{task.id}", params: {
      status: "in_progress",
      description: "Updated description"
    }, headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["status"]).to eq("in_progress")
    expect(json["description"]).to eq("Updated description")
  end

  it "member cannot update task title (forbidden field)" do
    member = create_user_in_org("member", @org, permissions: %w[tasks.index tasks.show tasks.update])
    task = create(:task, project_id: @project.id, assignee_id: member.id)

    put "/api/#{@org.slug}/tasks/#{task.id}", params: {
      title: "Should Not Change"
    }, headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  # ---------------------------------------------------------------
  # Member cannot create tasks
  # ---------------------------------------------------------------

  it "member cannot create a task" do
    member = create_user_in_org("member", @org, permissions: %w[tasks.index tasks.show tasks.update])

    post "/api/#{@org.slug}/tasks", params: {
      title: "Should Fail",
      project_id: @project.id
    }, headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  # ---------------------------------------------------------------
  # Viewer cannot update or delete
  # ---------------------------------------------------------------

  it "viewer cannot update a task" do
    viewer = create_user_in_org("viewer", @org, permissions: %w[tasks.index tasks.show])
    task = create(:task, project_id: @project.id, assignee_id: viewer.id)

    put "/api/#{@org.slug}/tasks/#{task.id}", params: {
      status: "done"
    }, headers: auth_headers(viewer), as: :json

    expect(response).to have_http_status(:forbidden)
  end
end
