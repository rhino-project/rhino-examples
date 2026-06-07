// Re-export the Rhino-generated model schemas as friendly, fully-required types.
// The generator emits everything as optional (`field?:`) because the source is
// an OpenAPI-ish schema; we tighten them here for nicer DX on the consumer side.
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

// Convenience types for relations populated via ?include=
export type ProjectWithTasks    = Project & { tasks?: Task[] };
export type TaskWithAssignee    = Task & { assignee?: User };
export type CommentWithAuthor   = Comment & { user?: User };

// Permission slug type — every resource exposes 5 CRUD verbs.
export type ResourceSlug = 'projects' | 'tasks' | 'comments' | 'labels' | 'users';
export type ActionSlug   = 'index' | 'show' | 'store' | 'update' | 'destroy' | 'trashed' | 'restore' | 'force-delete';
export type PermissionSlug = `${ResourceSlug}.${ActionSlug}` | '*' | `${ResourceSlug}.*`;
