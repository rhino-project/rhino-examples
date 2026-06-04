// Tiny pub/sub for the 403 "not a member of this group" signal.
//
// configureApi({ onForbidden }) is called once at startup (main.tsx). The lib's
// axios interceptor invokes onForbidden on ANY 403 (membership denied) WITHOUT
// clearing the token. We publish that here so React views can show a clear
// "you're not a member of the {group} group" message.

type Listener = (message: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

export function setForbidden(message: string | null) {
  current = message;
  listeners.forEach((l) => l(current));
}

export function getForbidden() {
  return current;
}

export function subscribeForbidden(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
