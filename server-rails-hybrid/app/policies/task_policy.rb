# frozen_string_literal: true

class TaskPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(user)
    if has_role?(user, "owner") || has_role?(user, "admin") || has_role?(user, "manager")
      ["*"]
    elsif has_role?(user, "member") || has_role?(user, "viewer")
      %w[id title description status priority due_date project_id assignee_id]
    else
      []
    end
  end

  def hidden_attributes_for_show(user)
    if has_role?(user, "member") || has_role?(user, "viewer")
      %w[estimated_hours]
    else
      []
    end
  end

  def permitted_attributes_for_create(user)
    if has_role?(user, "owner") || has_role?(user, "admin") || has_role?(user, "manager")
      %w[title description status priority estimated_hours due_date project_id assignee_id]
    else
      []
    end
  end

  def permitted_attributes_for_update(user)
    if has_role?(user, "owner") || has_role?(user, "admin") || has_role?(user, "manager")
      %w[title description status priority estimated_hours due_date project_id assignee_id]
    elsif has_role?(user, "member")
      %w[status description]
    else
      []
    end
  end
end
