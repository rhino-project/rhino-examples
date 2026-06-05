// Augment @rhino-dev/rhino-react with runtime exports whose declarations are
// not (fully) resolvable from the shipped type bundle. The dist `lib/index.d.ts`
// re-exports `api` / `configureApi` / `getTenancy` from a `./axios` module whose
// `.d.ts` is not emitted, so those names don't surface with usable types. We
// declare the SUBSET this app actually uses. (This augments — it does not edit —
// the lib. The file must stay a module via the `export {}` below so TS merges
// rather than replaces the package's declarations.)
import type { AxiosInstance } from 'axios';

export {};

declare module '@rhino-dev/rhino-react' {
  export const api: AxiosInstance;

  export function configureApi(options: {
    baseURL?: string;
    timeout?: number;
    routeGroup?: string | null;
    tenancy?: 'path' | 'subdomain';
    onUnauthorized?: () => void;
    onForbidden?: (error: unknown) => void;
  }): void;

  export function getTenancy(): 'path' | 'subdomain';
}
