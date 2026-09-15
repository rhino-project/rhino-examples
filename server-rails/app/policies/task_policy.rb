# frozen_string_literal: true

class TaskPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(user)
    if has_role?(user, "owner") || has_role?(user, "admin") || has_role?(user, "manager")
      ["*"]
    elsif has_role?(user, "member") || has_role?(user, "viewer")
      # Computed attributes go through this same gate. Junior roles may ask for
      # the windowed counts but not the money-adjacent or per-status
      # breakdowns (see hidden_attributes_for_show).
      %w[id title description status priority due_date project_id assignee_id
         comment_count is_overdue is_due_before
         total_count open_tasks_count done_tasks_count high_priority_count
         tasks_due_between count_by_status windowed_task_count]
    else
      []
    end
  end

  def hidden_attributes_for_show(user)
    if has_role?(user, "member") || has_role?(user, "viewer")
      # The blacklist beats the whitelist: 'count_by_status' is listed above and
      # still denied here. A denied computed attribute reports the same
      # "is not allowed" message an undeclared one does, and that check runs
      # BEFORE any argument binding — so a junior role cannot learn an attribute
      # exists by probing its parameters.
      %w[estimated_hours count_by_status]
    else
      []
    end
  end

  # Named scopes each role may select with ?scope=. Everyone can list their own
  # work; the date-window scopes are for the roles that plan schedules.
  def permitted_scopes(user)
    if has_role?(user, "owner") || has_role?(user, "admin") || has_role?(user, "manager")
      ["*"]
    else
      %w[assigned_to_me by_status]
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
