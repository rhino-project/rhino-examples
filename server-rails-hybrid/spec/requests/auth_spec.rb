# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth", type: :request do
  it "logs in with valid credentials and returns token" do
    user = create(:user, email: "test@example.com", password: "secret123")

    post "/api/auth/login", params: { email: "test@example.com", password: "secret123" }, as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json).to have_key("token")
  end

  it "rejects login with invalid credentials" do
    create(:user, email: "test@example.com", password: "secret123")

    post "/api/auth/login", params: { email: "test@example.com", password: "wrong-password" }, as: :json

    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects login with non-existent email" do
    post "/api/auth/login", params: { email: "nobody@example.com", password: "secret123" }, as: :json

    expect(response).to have_http_status(:unauthorized)
  end

  it "requires authentication to access protected endpoints" do
    org = create(:organization)

    get "/api/#{org.slug}/projects", as: :json

    # Without authentication, the request is denied (401) or the org middleware
    # rejects before auth check (404). Both are acceptable.
    expect(response.status).to be_in([401, 404])
  end

  it "can logout" do
    user = create(:user)
    user.regenerate_api_token

    post "/api/auth/logout", headers: auth_headers(user), as: :json

    expect(response).to have_http_status(:ok)
  end
end
