const listeners = new Set();

export const store = {
  user: null,
  authChecked: false,
  categories: [],
  unreadCount: 0,
};

export function setState(patch) {
  Object.assign(store, patch);
  for (const fn of listeners) {
    fn(store);
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

