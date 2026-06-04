// SINGLE-TENANT variant — user-owned Project (userId), role-free validation.
import { z } from 'zod';
import type { ModelRegistration } from '@rhino-dev/rhino-nestjs';

import { ProjectPolicy } from '../policies/ProjectPolicy';

// Role-free: a single `'*'` schema is used for every authenticated user.
// `userId` is stamped by StampProjectOwner before validation, so it is allowed
// here but never read from client input.
const validationStore: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    userId: z.number().int().optional(),
    title: z.string(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    budget: z.number().nullable().optional(),
    internalNotes: z.string().nullable().optional(),
    startsAt: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
    endsAt: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
  }),
};

const validationUpdate: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    budget: z.number().nullable().optional(),
    internalNotes: z.string().nullable().optional(),
    startsAt: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
    endsAt: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
  }),
};

export const projectsRegistration: ModelRegistration = {
  model: 'Project',
  policy: ProjectPolicy,
  validationStore,
  validationUpdate,
  allowedFilters: ['title', 'status'],
  allowedSorts: ['title', 'status', 'startsAt', 'endsAt'],
  allowedSearch: ['title'],
  belongsToOrganization: false, // user-owned, not org-owned
  softDeletes: true,
  hasAuditTrail: true,
};
