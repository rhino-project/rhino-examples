// Augment @rhino-dev/rhino-react with the runtime-only exports it ships but
// doesn't declare in its type bundle (configureApi).
//
// IMPORTANT: this file must be a module (i.e. contain at least one top-level
// import or export). Otherwise TypeScript treats it as a global ambient
// declaration that *replaces* the package's existing types rather than
// extending them — which would erase useModelIndex / useModelShow / etc.
export {};

declare module '@rhino-dev/rhino-react' {
  export function configureApi(options: { baseURL?: string; timeout?: number }): void;
}
