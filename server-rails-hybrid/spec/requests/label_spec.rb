# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Labels", type: :request do
  before do
    seed_roles
    @org = create(:organization)
  end

  # ---------------------------------------------------------------
  # CRUD
  # ---------------------------------------------------------------

  it "admin can create a label" do
    user = create_user_in_org("admin", @org)

    post "/api/#{@org.slug}/labels", params: {
      name: "bug",
      color: "#ff0000"
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json["name"]).to eq("bug")
    expect(json["color"]).to eq("#ff0000")
  end

  it "admin can list labels" do
    user = create_user_in_org("admin", @org)
    create(:label, organization_id: @org.id)

    get "/api/#{@org.slug}/labels", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    data = json["data"] || json
    expect(data.length).to eq(1)
  end

  it "admin can update a label" do
    user = create_user_in_org("admin", @org)
    label = create(:label, organization_id: @org.id)

    put "/api/#{@org.slug}/labels/#{label.id}", params: {
      name: "updated-name"
    }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["name"]).to eq("updated-name")
  end

  it "admin can soft-delete a label" do
    user = create_user_in_org("admin", @org)
    label = create(:label, organization_id: @org.id)

    delete "/api/#{@org.slug}/labels/#{label.id}", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:no_content)
    expect(Label.kept.find_by(id: label.id)).to be_nil
    expect(Label.with_discarded.find_by(id: label.id)).not_to be_nil
  end

  # ---------------------------------------------------------------
  # Force-delete disabled
  # ---------------------------------------------------------------

  it "force-delete route does not exist for labels" do
    user = create_user_in_org("admin", @org)
    label = create(:label, organization_id: @org.id)
    label.discard!

    delete "/api/#{@org.slug}/labels/#{label.id}/force-delete", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:not_found)
  end

  # ---------------------------------------------------------------
  # Member/viewer are read-only
  # ---------------------------------------------------------------

  it "member cannot create a label" do
    user = create_user_in_org("member", @org, permissions: %w[labels.index labels.show])

    post "/api/#{@org.slug}/labels", params: { name: "should-fail" }, headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  it "viewer can list labels" do
    user = create_user_in_org("viewer", @org, permissions: %w[labels.index labels.show])
    create(:label, organization_id: @org.id)

    get "/api/#{@org.slug}/labels", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
  end

  # ---------------------------------------------------------------
  # Cross-org isolation
  # ---------------------------------------------------------------

  it "labels are isolated per organization" do
    user = create_user_in_org("admin", @org)
    other_org = create(:organization)

    create(:label, organization_id: @org.id, name: "mine")
    create(:label, organization_id: other_org.id, name: "theirs")

    get "/api/#{@org.slug}/labels", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    labels = json["data"] || json
    expect(labels.length).to eq(1)
    expect(labels[0]["name"]).to eq("mine")
  end
end
