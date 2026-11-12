import { store } from '../js/state.js';
import { escapeHtml, showToast } from '../js/utils.js';
import { logout } from '../js/auth.js';
import { navigate } from '../js/router.js';

export function renderNavbar() {
  const user = store.user;
  const currentPath = window.location.pathname;
  const unread = store.unreadCount || 0;

  const navLinkClass = (path) => {
    const active = currentPath === path || (path !== '/' && currentPath.startsWith(path));
    return active
      ? 'text-primary font-semibold bg-primary-50/80 px-3 py-2 rounded-lg text-sm transition'
      : 'text-slate-600 hover:text-dark hover:bg-slate-100/80 px-3 py-2 rounded-lg text-sm font-medium transition';
  };

  return `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between gap-4">
          <!-- Brand -->
          <a href="/" data-link class="flex items-center gap-2.5 shrink-0">
            <div class="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div class="leading-tight">
              <span class="block font-display text-base font-bold text-dark tracking-tight">Where Is It?</span>
              <span class="block text-[11px] font-medium text-muted">Campus Lost &amp; Found</span>
            </div>
          </a>

          <!-- Desktop Nav -->
          <nav class="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <a href="/" data-link class="${navLinkClass('/')}">Home</a>
            <a href="/lost-items" data-link class="${navLinkClass('/lost-items')}">Lost Items</a>
            <a href="/found-items" data-link class="${navLinkClass('/found-items')}">Found Items</a>
            <a href="/about" data-link class="${navLinkClass('/about')}">About</a>
          </nav>

          <!-- Right Actions -->
          <div class="hidden md:flex items-center gap-2.5">
            ${user
      ? `
              <a href="/dashboard/report-lost" data-link class="btn-secondary py-2 px-3 text-xs">
                + Report Item
              </a>
              <a href="/dashboard/notifications" data-link class="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-dark transition" aria-label="Notifications">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                ${unread > 0
        ? `<span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">${unread > 99 ? '99+' : unread}</span>`
        : ''
      }
              </a>
              ${user.role === 'ADMIN'
        ? `<a href="/admin" data-link class="btn bg-purple-600 text-white hover:bg-purple-700 py-2 px-3 text-xs">Admin Panel</a>`
        : ''
      }
              <a href="/dashboard" data-link class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100 transition">
                <div class="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  ${escapeHtml(user.full_name?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <span class="text-xs font-semibold text-dark max-w-[110px] truncate">${escapeHtml(user.full_name)}</span>
              </a>
              <button type="button" data-logout-btn class="btn-ghost py-2 px-2.5 text-xs text-danger hover:bg-red-50">Logout</button>
            `
      : `
              <a href="/login" data-link class="btn-ghost py-2 px-3.5 text-sm">Log In</a>
              <a href="/register" data-link class="btn-primary py-2 px-4 text-sm">Register</a>
            `
    }
          </div>

          <!-- Mobile menu button -->
          <button type="button" id="mobile-menu-toggle" class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Toggle Menu">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5">
        <a href="/" data-link class="block ${navLinkClass('/')}">Home</a>
        <a href="/lost-items" data-link class="block ${navLinkClass('/lost-items')}">Lost Items</a>
        <a href="/found-items" data-link class="block ${navLinkClass('/found-items')}">Found Items</a>
        <a href="/about" data-link class="block ${navLinkClass('/about')}">About</a>
        <div class="pt-2 border-t border-slate-100 flex flex-col gap-2">
          ${user
      ? `
            <a href="/dashboard" data-link class="btn-secondary w-full justify-start">Dashboard (${escapeHtml(user.full_name)})</a>
            <a href="/dashboard/notifications" data-link class="btn-secondary w-full justify-between">
              <span>Notifications</span>
              ${unread > 0 ? `<span class="badge bg-danger text-white">${unread}</span>` : ''}
            </a>
            ${user.role === 'ADMIN'
        ? `<a href="/admin" data-link class="btn bg-purple-600 text-white w-full justify-start">Admin Dashboard</a>`
        : ''
      }
            <button type="button" data-logout-btn class="btn-danger w-full">Logout</button>
          `
      : `
            <a href="/login" data-link class="btn-secondary w-full">Log In</a>
            <a href="/register" data-link class="btn-primary w-full">Create Campus Account</a>
          `
    }
        </div>
      </div>
    </header>
  `;
}

export function bindNavbarEvents(container) {
  const toggle = container.querySelector('#mobile-menu-toggle');
  const mobileMenu = container.querySelector('#mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  container.querySelectorAll('[data-logout-btn]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await logout();
      showToast('Logged out successfully.', 'success');
      navigate('/');
    });
  });
}
