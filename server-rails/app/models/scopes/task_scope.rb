# frozen_string_literal: true

module Scopes
  # TaskScope -- members only see tasks assigned to them.
  #
  # Auto-discovered by the HasAutoScope concern via naming convention.
  class TaskScope < Rhino::ResourceScope
    def apply(relation)
      # Members only see tasks assigned to them
      if role == "member"
        relation.where(assignee_id: user.id)
      else
        relation
      end
    end
  end
end
