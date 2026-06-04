// HYBRID variant — Label is org-scoped (agency/vendor). Personal group shares the
// same model but with no org filter (returns global labels for that path).
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
  belongsToOrganization: true,
  softDeletes: true,
  hasAuditTrail: false,
  exceptActions: ['forceDelete'],
};
