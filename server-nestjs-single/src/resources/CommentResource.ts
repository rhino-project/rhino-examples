// SINGLE-TENANT variant — Comment ownership inherited via Task → Project.
import { z } from 'zod';
import type { ModelRegistration } from '@rhino-dev/rhino-nestjs';

import { CommentPolicy } from '../policies/CommentPolicy';

// `userId` (author) is stamped by StampProjectOwner before validation.
const validationStore: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    userId: z.number().int().optional(),
    body: z.string(),
    taskId: z.number().int(),
  }),
};

const validationUpdate: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    body: z.string().optional(),
  }),
};

export const commentsRegistration: ModelRegistration = {
  model: 'Comment',
  policy: CommentPolicy,
  validationStore,
  validationUpdate,
  belongsToOrganization: false,
  softDeletes: true,
  hasAuditTrail: false,
  hasUuid: true,
  owner: 'task.project',
  fkConstraints: [{ field: 'taskId', model: 'task' }, { field: 'userId', model: 'user' }],
};
