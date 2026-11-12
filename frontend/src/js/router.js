import { store } from './state.js';

const routes = [];
let notFoundHandler = null;
let renderRoot = null;

export function registerRoute(pathPattern, handler, options = {}) {
  const paramNames = [];
  const regexStr = pathPattern
    .replace(/\/+$/, '')
    .replace(/:([^/]+)/g, (_, key) => {
      paramNames.push(key);
      return '([^/]+)';
    });
  const regex = new RegExp(`^${regexStr || '/'}$`);
  routes.push({
    pathPattern,
    regex,
    paramNames,
    handler,
    options,
  });
}

export function setNotFoundHandler(fn) {
  notFoundHandler = fn;
}

export function navigate(to, { replace = false } = {}) {
  if (!to) return;
  const targetUrl = new URL(to, window.location.origin);
  const current = window.location.pathname + window.location.search;
  const next = targetUrl.pathname + targetUrl.search;
  if (current !== next) {
    if (replace) {
      window.history.replaceState({}, '', next);
    } else {
      window.history.pushState({}, '', next);
    }
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  resolveCurrentRoute();
}

export async function resolveCurrentRoute() {
  if (!renderRoot) return;
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

  for (const route of routes) {
    const match = pathname.match(route.regex);
    if (!match) continue;

    // Route Guards
    if (route.options.requireAuth && !store.user) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${redirect}`, { replace: true });
      return;
    }

    if (route.options.requireAdmin && (!store.user || store.user.role !== 'ADMIN')) {
      navigate(store.user ? '/dashboard' : '/login', { replace: true });
      return;
    }

    if (route.options.guestOnly && store.user) {
      navigate(store.user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
      return;
    }

    const params = {};
    route.paramNames.forEach((name, idx) => {
      params[name] = decodeURIComponent(match[idx + 1]);
    });

    await route.handler(renderRoot, {
      params,
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
      pathname,
    });
    return;
  }

  if (notFoundHandler) {
    await notFoundHandler(renderRoot, { pathname });
  }
}

export function startRouter(rootEl) {
  renderRoot = rootEl;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
      return;
    }
    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    resolveCurrentRoute();
  });

  resolveCurrentRoute();
}

