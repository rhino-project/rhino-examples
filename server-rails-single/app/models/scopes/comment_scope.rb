# frozen_string_literal: true

module Scopes
  # CommentScope — single-tenant ownership isolation (inherited via Task → Project).
  #
  # A comment is owned through its task's project. We constrain to comments whose
  # task belongs to a project owned by the current user.
  class CommentScope < Rhino::ResourceScope
    def apply(relation)
      return relation unless user

      owned_projects = Project.unscoped.where(user_id: user.id).select(:id)
      owned_tasks = Task.unscoped.where(project_id: owned_projects).select(:id)
      relation.where(task_id: owned_tasks)
    end
  end
end
