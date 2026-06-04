// SINGLE-TENANT variant — Label is a SHARED GLOBAL catalog (no ownership scope).
import { z } from 'zod';
import type { ModelRegistration } from '@rhino-dev/rhino-nestjs';

import { LabelPolicy } from '../policies/LabelPolicy';

const validationStore: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    name: z.string(),
    color: z.string().nullable().optional(),
  }),
};

const validationUpdate: Record<string, z.ZodTypeAny> = {
  '*': z.object({
    name: z.string().optional(),
    color: z.string().nullable().optional(),
  }),
};

export const labelsRegistration: ModelRegistration = {
  model: 'Label',
  policy: LabelPolicy,
  validationStore,
  validationUpdate,
  allowedFilters: ['name'],
  allowedSorts: ['name'],
  allowedSearch: ['name'],
  belongsToOrganization: false, // global catalog, not org-owned
  softDeletes: true,
  hasAuditTrail: false,
  exceptActions: ['forceDelete'],
};
