# frozen_string_literal: true

class CommentPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(user)
    if has_role?(user, "owner") || has_role?(user, "admin") ||
       has_role?(user, "manager") || has_role?(user, "member") ||
       has_role?(user, "viewer")
      ["*"]
    else
      []
    end
  end

  def hidden_attributes_for_show(user)
    []
  end

  def permitted_attributes_for_create(user)
    if has_role?(user, "owner") || has_role?(user, "admin") ||
       has_role?(user, "manager") || has_role?(user, "member")
      %w[body task_id]
    else
      []
    end
  end

  def permitted_attributes_for_update(user)
    if has_role?(user, "owner") || has_role?(user, "admin") ||
       has_role?(user, "manager") || has_role?(user, "member")
      %w[body]
    else
      []
    end
  end
end
