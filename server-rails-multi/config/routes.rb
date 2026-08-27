Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Custom dashboard controller using the Rhino resource-scope resolver.
  # Declared here (via app.routes) so it is registered BEFORE the Rhino engine
  # appends its CRUD/tenant routes, giving it precedence for the same path.
  # Registered BEFORE the tenant route below, which would otherwise match
  # /api/admin/dashboard with :organization = "admin".
  #
  # The controller declares its group with `rhino_route_group :admin` (the
  # `admin` group is `tenant: false`), so Rhino.query spans every organization
  # there. `defaults:` is the alternative when the controller is shared:
  #   get "/api/admin/dashboard", to: "admin_dashboard#summary",
  #                               defaults: { route_group: "admin" }
  get "/api/admin/dashboard", to: "admin_dashboard#summary"
  # The same resolver call inside the TENANT group with no organization: raises.
  get "/api/admin/tenant_probe", to: "admin_dashboard#tenant_probe"

  get "/api/:organization/dashboard", to: "dashboard#summary"
  # Fail-closed demonstration: Rhino.query with NO tenant context.
  get "/api/dashboard/unscoped_probe", to: "dashboard#unscoped_probe"

  # Defines the root path route ("/")
  # root "posts#index"
end
