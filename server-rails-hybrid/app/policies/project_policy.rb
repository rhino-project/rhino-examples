# frozen_string_literal: true

class ProjectPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(user)
    if has_role?(user, "owner") || has_role?(user, "admin")
      ["*"]
    elsif has_role?(user, "manager")
      %w[id title description status budget starts_at ends_at]
    elsif has_role?(user, "member") || has_role?(user, "viewer")
      %w[id title description status starts_at ends_at]
    else
      []
    end
  end

  def hidden_attributes_for_show(user)
    if has_role?(user, "manager")
      %w[internal_notes]
    elsif has_role?(user, "member") || has_role?(user, "viewer")
      %w[budget internal_notes]
    else
      []
    end
  end

  def permitted_attributes_for_create(user)
    if has_role?(user, "owner") || has_role?(user, "admin")
      %w[title description status budget internal_notes starts_at ends_at]
    elsif has_role?(user, "manager")
      %w[title description status starts_at ends_at]
    else
      []
    end
  end

  def permitted_attributes_for_update(user)
    if has_role?(user, "owner") || has_role?(user, "admin")
      %w[title description status budget internal_notes starts_at ends_at]
    elsif has_role?(user, "manager")
      %w[title description status starts_at ends_at]
    else
      []
    end
  end
end
