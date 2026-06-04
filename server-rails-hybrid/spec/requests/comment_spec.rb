# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Comments", type: :request do
  before do
    seed_roles
    @org = create(:organization)
    @project = create(:project, organization_id: @org.id)
    @task = create(:task, project_id: @project.id)
  end

  # ---------------------------------------------------------------
  # CRUD
  # ---------------------------------------------------------------

  it "admin can create a comment" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/comments", params: {
      body: "This is a comment",
      task_id: @task.id
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json["body"]).to eq("This is a comment")
  end

  it "auto-sets user_id on comment creation" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/comments", params: {
      body: "Auto user id test",
      task_id: @task.id
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json["user_id"]).to eq(user.id)
  end

  it "comment has a uuid" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/comments", params: {
      body: "UUID test",
      task_id: @task.id
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    comment = Comment.find(json["id"])
    expect(comment.uuid).not_to be_nil
    expect(comment.uuid).to match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  end

  it "admin can list comments" do
    user = create_user_in_org("admin", @org)
    create(:comment, task_id: @task.id, user_id: user.id)

    get "/api/#{@org.slug}/comments", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
  end

  it "member can create a comment" do
    member = create_user_in_org("member", @org, permissions: %w[comments.index comments.show comments.store comments.update tasks.index tasks.show])
    @task.update!(assignee_id: member.id)

    post "/api/#{@org.slug}/comments", params: {
      body: "Member comment",
      task_id: @task.id
    }, headers: auth_headers(member), as: :json

    expect(response).to have_http_status(:created)
  end

  it "viewer cannot create a comment" do
    viewer = create_user_in_org("viewer", @org, permissions: %w[comments.index comments.show])

    post "/api/#{@org.slug}/comments", params: {
      body: "Should fail",
      task_id: @task.id
    }, headers: auth_headers(viewer), as: :json

    expect(response).to have_http_status(:forbidden)
  end
end
