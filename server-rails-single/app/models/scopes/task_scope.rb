# frozen_string_literal: true

module Scopes
  # TaskScope — single-tenant ownership isolation (inherited via parent Project).
  #
  # A Task has no user_id of its own; it is owned by whoever owns its Project.
  # We therefore constrain to tasks whose project belongs to the current user.
  #
  # Auto-discovered by the HasAutoScope concern via naming convention. With no
  # request user (console/seeds) `user` is nil and no filter is applied.
  class TaskScope < Rhino::ResourceScope
    def apply(relation)
      return relation unless user

      relation.where(project_id: Project.unscoped.where(user_id: user.id).select(:id))
    end
  end
end
