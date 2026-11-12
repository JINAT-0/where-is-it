import { store } from '../js/state.js';
import { escapeHtml } from '../js/utils.js';
import { renderNavbar, bindNavbarEvents } from './navbar.js';
import { renderFooter } from './footer.js';

export function renderPublicShell(contentHtml) {
  return `
    ${renderNavbar()}
    <main class="flex-1">
      ${contentHtml}
    </main>
    ${renderFooter()}
  `;
}

export function bindShellEvents(root) {
  bindNavbarEvents(root);
}

export function renderDashboardShell({ title, subtitle = '', activePath = '', isAdmin = false, contentHtml }) {
  const user = store.user;
  const unread = store.unreadCount || 0;

  const userLinks = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/report-lost', label: 'Report Lost Item' },
    { href: '/dashboard/report-found', label: 'Report Found Item' },
    { href: '/dashboard/my-reports', label: 'My Reports' },
    { href: '/dashboard/my-claims', label: 'My Claims' },
    { href: '/dashboard/notifications', label: 'Notifications', badge: unread > 0 ? unread : null },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/change-password', label: 'Change Password' },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin Overview' },
    { href: '/admin/users', label: 'User Management' },
    { href: '/admin/reports', label: 'Report Management' },
    { href: '/admin/claims', label: 'Claim Management' },
    { href: '/admin/categories', label: 'Category Management' },
    { href: '/admin/activity-logs', label: 'Activity Logs' },
    { href: '/admin/settings', label: 'System Settings' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const linkClass = (href) => {
    const isActive = activePath === href;
    return isActive
      ? 'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white shadow-sm'
      : 'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-dark transition';
  };

  return `
    ${renderNavbar()}
    <div class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-3">
          <div class="card p-4 sticky top-24">
            <div class="pb-4 mb-4 border-b border-slate-100">
              <p class="text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-purple-600' : 'text-primary'}">
                ${isAdmin ? 'Administrator Console' : 'Campus Member Portal'}
              </p>
              <p class="mt-1 text-sm font-bold text-dark truncate">${escapeHtml(user?.full_name || '')}</p>
              <p class="text-xs text-muted truncate">${escapeHtml(user?.department || '')} &bull; ${escapeHtml(user?.role || '')}</p>
            </div>
            <nav class="space-y-1" aria-label="Dashboard navigation">
              ${links
      .map(
        (l) => `
                <a href="${l.href}" data-link class="${linkClass(l.href)}">
                  <span>${escapeHtml(l.label)}</span>
                  ${l.badge
            ? `<span class="badge bg-danger text-white text-[11px]">${l.badge}</span>`
            : ''
          }
                </a>`
      )
      .join('')}
            </nav>
            ${user?.role === 'ADMIN'
      ? `<div class="mt-5 pt-4 border-t border-slate-100">
                    <a href="${isAdmin ? '/dashboard' : '/admin'}" data-link class="btn-secondary w-full text-xs">
                      ${isAdmin ? 'Switch to User Dashboard' : 'Open Admin Dashboard'}
                    </a>
                  </div>`
      : ''
    }
          </div>
        </aside>

        <!-- Main Workspace -->
        <main class="lg:col-span-9 min-w-0">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-dark tracking-tight">${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="mt-1 text-sm text-muted">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <div id="dashboard-content">
            ${contentHtml}
          </div>
        </main>
      </div>
    </div>
    ${renderFooter()}
  `;
}
