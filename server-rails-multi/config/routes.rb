Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Custom dashboard controller using the Rhino resource-scope resolver.
  # Declared here (via app.routes) so it is registered BEFORE the Rhino engine
  # appends its CRUD/tenant routes, giving it precedence for the same path.
  get "/api/:organization/dashboard", to: "dashboard#summary"
  # Fail-closed demonstration: Rhino.query with NO tenant context.
  get "/api/dashboard/unscoped_probe", to: "dashboard#unscoped_probe"

  # Defines the root path route ("/")
  # root "posts#index"
end
