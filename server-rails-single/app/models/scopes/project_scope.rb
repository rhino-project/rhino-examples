# frozen_string_literal: true

module Scopes
  # ProjectScope — single-tenant ownership isolation.
  #
  # Auto-discovered by HasAutoScope ({Model}Scope convention) and applied as a
  # default scope on every Project query, so the authenticated user only ever
  # sees / mutates their own projects.
  #
  # With no request user (console/seeds) `user` is nil and no filter is applied,
  # so seeding can create projects for any user.
  class ProjectScope < Rhino::ResourceScope
    def apply(relation)
      return relation unless user

      relation.where(user_id: user.id)
    end
  end
end
