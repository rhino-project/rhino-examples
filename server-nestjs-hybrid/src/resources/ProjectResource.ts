// HYBRID variant — Project is org-owned (agency/vendor) OR user-owned (personal).
import { z } from 'zod';
import type { ModelRegistration } from '@rhino-dev/rhino-nestjs';

import { ProjectPolicy } from '../policies/ProjectPolicy';

const validationStore: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    userId: z.number().int().optional(), // stamped for the personal group only
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
  belongsToOrganization: true, // org groups get org filtering; personal handled by scope
  softDeletes: true,
  hasAuditTrail: true,
};
