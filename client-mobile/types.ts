// Mirror of client-web/src/types.ts — re-export the Rhino-generated schemas
// as fully-required types for nicer DX.
import type { components } from './rhino.d.ts';

type Required<T> = { [K in keyof T]-?: T[K] };

export type Organization = Required<components['schemas']['Organization']>;
export type Role         = Required<components['schemas']['Role']>;
export type User         = Required<components['schemas']['User']>;
export type UserRole     = Required<components['schemas']['UserRole']>;
export type Comment      = Required<components['schemas']['Comment']>;
export type Label        = Required<components['schemas']['Label']>;
export type Project      = Required<components['schemas']['Project']>;
export type Task         = Required<components['schemas']['Task']>;

export type TaskWithAssignee = Task & { assignee?: User };
