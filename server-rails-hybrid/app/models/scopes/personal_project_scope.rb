# frozen_string_literal: true

module Scopes
  # PersonalProjectScope — user-owned isolation for the `personal` group.
  #
  # Auto-discovered by HasAutoScope. Constrains every PersonalProject query to
  # the current user's rows. With no request user (console/seeds) `user` is nil
  # and no filter is applied.
  class PersonalProjectScope < Rhino::ResourceScope
    def apply(relation)
      return relation unless user

      relation.where(user_id: user.id)
    end
  end
end
