// SINGLE-TENANT variant — Task ownership inherited via parent Project.
import { z } from 'zod';
import type { ModelRegistration } from '@rhino-dev/rhino-nestjs';

import { TaskPolicy } from '../policies/TaskPolicy';

const validationStore: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    estimatedHours: z.number().nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
    projectId: z.number().int(),
    assignedTo: z.number().int().nullable().optional(),
  }),
};

const validationUpdate: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    estimatedHours: z.number().nullable().optional(),
    dueDate: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
    projectId: z.number().int().optional(),
    assignedTo: z.number().int().nullable().optional(),
  }),
};

export const tasksRegistration: ModelRegistration = {
  model: 'Task',
  policy: TaskPolicy,
  validationStore,
  validationUpdate,
  allowedFilters: ['title', 'status', 'priority'],
  allowedSorts: ['title', 'status', 'priority', 'dueDate'],
  allowedSearch: ['title'],
  belongsToOrganization: false,
  softDeletes: true,
  hasAuditTrail: true,
  owner: 'project',
  fkConstraints: [{ field: 'projectId', model: 'project' }, { field: 'assignedTo', model: 'user' }],
};
