import './css/main.css';
import { initAuth } from './js/auth.js';
import { registerRoute, setNotFoundHandler, startRouter } from './js/router.js';
import { renderHomePage } from './pages/homePage.js';
import { renderAboutPage } from './pages/aboutPage.js';
import { createBrowseItemsHandler } from './pages/browseItemsPage.js';
import { renderItemDetailsPage } from './pages/itemDetailsPage.js';
import { renderLoginPage, renderRegisterPage } from './pages/authPages.js';
import {
  renderNotFoundPage,
  renderPrivacyPage,
  renderTermsPage,
} from './pages/legalPages.js';
import {
  renderChangePasswordPage,
  renderMyClaimsPage,
  renderMyReportsPage,
  renderNotificationsPage,
  renderProfilePage,
  renderReportItemPage,
  renderUserOverviewPage,
} from './pages/userDashboardPages.js';
import {
  renderAdminActivityLogsPage,
  renderAdminCategoriesPage,
  renderAdminClaimsPage,
  renderAdminOverviewPage,
  renderAdminReportsPage,
  renderAdminSettingsPage,
  renderAdminUsersPage,
} from './pages/adminDashboardPages.js';

// Public Pages
registerRoute('/', renderHomePage);
registerRoute('/about', renderAboutPage);
registerRoute('/lost-items', createBrowseItemsHandler('LOST'));
registerRoute('/found-items', createBrowseItemsHandler('FOUND'));
registerRoute('/items/:id', renderItemDetailsPage);
registerRoute('/login', renderLoginPage, { guestOnly: true });
registerRoute('/register', renderRegisterPage, { guestOnly: true });
registerRoute('/privacy-policy', renderPrivacyPage);
registerRoute('/terms', renderTermsPage);

// User Dashboard Pages (Protected)
registerRoute('/dashboard', renderUserOverviewPage, { requireAuth: true });
registerRoute(
  '/dashboard/report-lost',
  (root) => renderReportItemPage(root, { reportType: 'LOST' }),
  { requireAuth: true }
);
registerRoute(
  '/dashboard/report-found',
  (root) => renderReportItemPage(root, { reportType: 'FOUND' }),
  { requireAuth: true }
);
registerRoute(
  '/dashboard/edit/:id',
  (root, ctx) => renderReportItemPage(root, { editItemId: ctx.params.id }),
  { requireAuth: true }
);
registerRoute('/dashboard/my-reports', renderMyReportsPage, { requireAuth: true });
registerRoute('/dashboard/my-claims', renderMyClaimsPage, { requireAuth: true });
registerRoute('/dashboard/notifications', renderNotificationsPage, { requireAuth: true });
registerRoute('/dashboard/profile', renderProfilePage, { requireAuth: true });
registerRoute('/dashboard/change-password', renderChangePasswordPage, { requireAuth: true });

// Admin Dashboard Pages (Admin Only)
registerRoute('/admin', renderAdminOverviewPage, { requireAuth: true, requireAdmin: true });
registerRoute('/admin/users', renderAdminUsersPage, { requireAuth: true, requireAdmin: true });
registerRoute('/admin/reports', renderAdminReportsPage, { requireAuth: true, requireAdmin: true });
registerRoute('/admin/claims', renderAdminClaimsPage, { requireAuth: true, requireAdmin: true });
registerRoute('/admin/categories', renderAdminCategoriesPage, {
  requireAuth: true,
  requireAdmin: true,
});
registerRoute('/admin/activity-logs', renderAdminActivityLogsPage, {
  requireAuth: true,
  requireAdmin: true,
});
registerRoute('/admin/settings', renderAdminSettingsPage, {
  requireAuth: true,
  requireAdmin: true,
});

// 404 Fallback
setNotFoundHandler(renderNotFoundPage);

async function bootstrap() {
  const root = document.getElementById('app');
  await initAuth();
  startRouter(root);
}

bootstrap();

