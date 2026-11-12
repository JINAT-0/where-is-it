import { bindShellEvents, renderDashboardShell } from '../components/dashboardShell.js';
import { resolveAssetUrl } from '../js/api.js';
import {
  approveAdminClaim,
  approveAdminItem,
  broadcastAdminAnnouncement,
  completeAdminClaimReturn,
  createAdminCategory,
  deleteAdminCategory,
  deleteAdminItem,
  getAdminActivityLogs,
  getAdminCategories,
  getAdminClaims,
  getAdminDashboard,
  getAdminItems,
  getAdminSettings,
  getAdminUsers,
  markAdminItemReturned,
  rejectAdminClaim,
  rejectAdminItem,
  updateAdminCategory,
  updateAdminSettings,
  updateAdminUserStatus,
} from '../js/dashboard.js';
import { getCategories } from '../js/items.js';
import { store } from '../js/state.js';
import {
  bindPagination,
  confirmDialog,
  escapeHtml,
  extractFormErrorMessage,
  formatDate,
  formatDateTime,
  promptDialog,
  renderBadge,
  renderEmptyState,
  renderErrorState,
  renderLoading,
  renderPagination,
  showToast,
} from '../js/utils.js';

export async function renderAdminOverviewPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Admin Overview',
    subtitle: 'Monitor campus Lost & Found activity, moderation queues, and item recoveries.',
    activePath: '/admin',
    isAdmin: true,
    contentHtml: renderLoading('Loading administrator statistics...'),
  });
  bindShellEvents(root);

  const content = root.querySelector('#dashboard-content');
  try {
    const { stats, pendingItems, pendingClaims, recentLogs } = await getAdminDashboard();
    content.innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Total Users</p>
          <p class="mt-2 text-3xl font-extrabold text-dark">${stats.total_users}</p>
          <p class="mt-1 text-xs text-muted">${stats.active_users} Active &bull; ${stats.suspended_users} Suspended</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Lost Reports</p>
          <p class="mt-2 text-3xl font-extrabold text-danger">${stats.total_lost_reports}</p>
          <p class="mt-1 text-xs text-muted">Campus-wide lost submissions</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Found Reports</p>
          <p class="mt-2 text-3xl font-extrabold text-primary">${stats.total_found_reports}</p>
          <p class="mt-1 text-xs text-muted">Campus-wide found submissions</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Pending Reports</p>
          <p class="mt-2 text-3xl font-extrabold text-warning">${stats.pending_reports}</p>
          <p class="mt-1 text-xs text-muted"><a href="/admin/reports?moderation_status=PENDING_REVIEW" data-link class="text-primary hover:underline">Review queue &rarr;</a></p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Pending Claims</p>
          <p class="mt-2 text-3xl font-extrabold text-amber-600">${stats.pending_claims}</p>
          <p class="mt-1 text-xs text-muted"><a href="/admin/claims" data-link class="text-primary hover:underline">Verify claims &rarr;</a></p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Returned Items</p>
          <p class="mt-2 text-3xl font-extrabold text-success">${stats.returned_items}</p>
          <p class="mt-1 text-xs text-muted">${stats.completed_claims} verified claim handovers</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-dark">Pending Reports Queue</h2>
            <a href="/admin/reports" data-link class="text-xs font-semibold text-primary hover:underline">Manage all</a>
          </div>
          ${pendingItems.length === 0
        ? `<p class="text-sm text-muted py-4">No reports waiting for moderation.</p>`
        : `<div class="space-y-3">
                  ${pendingItems
          .map(
            (i) => `
                    <div class="rounded-lg border border-slate-100 p-3 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-dark truncate">${escapeHtml(i.item_name)}</p>
                        <p class="text-xs text-muted">${escapeHtml(i.report_type)} &bull; ${escapeHtml(i.reporter_name)} &bull; ${formatDate(i.event_date)}</p>
                      </div>
                      <a href="/admin/reports" data-link class="btn-secondary py-1 px-2.5 text-xs shrink-0">Review</a>
                    </div>`
          )
          .join('')}
                </div>`
      }
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-dark">Pending Claims Queue</h2>
            <a href="/admin/claims" data-link class="text-xs font-semibold text-primary hover:underline">Manage all</a>
          </div>
          ${pendingClaims.length === 0
        ? `<p class="text-sm text-muted py-4">No claims awaiting verification.</p>`
        : `<div class="space-y-3">
                  ${pendingClaims
          .map(
            (c) => `
                    <div class="rounded-lg border border-slate-100 p-3 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-dark truncate">${escapeHtml(c.item_name)}</p>
                        <p class="text-xs text-muted">Claimant: ${escapeHtml(c.claimant_name)} &bull; ${formatDateTime(c.created_at)}</p>
                      </div>
                      <a href="/admin/claims" data-link class="btn-secondary py-1 px-2.5 text-xs shrink-0">Verify</a>
                    </div>`
          )
          .join('')}
                </div>`
      }
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-dark">Recent Admin Activity</h2>
          <a href="/admin/activity-logs" data-link class="text-xs font-semibold text-primary hover:underline">Full audit log</a>
        </div>
        ${recentLogs.length === 0
        ? `<p class="text-sm text-muted">No activity recorded yet.</p>`
        : `<div class="divide-y divide-slate-100">
                ${recentLogs
          .map(
            (l) => `
                  <div class="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div>
                      <span class="font-bold text-dark">${escapeHtml(l.action)}</span>
                      <span class="text-slate-600 ml-1.5">${escapeHtml(l.details || '')}</span>
                    </div>
                    <span class="text-muted shrink-0">${escapeHtml(l.admin_name)} &bull; ${formatDateTime(l.created_at)}</span>
                  </div>`
          )
          .join('')}
              </div>`
      }
      </div>
    `;
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
  }
}

export async function renderAdminUsersPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'User Management',
    subtitle: 'View campus accounts, filter by role or status, and suspend or reactivate users.',
    activePath: '/admin/users',
    isAdmin: true,
    contentHtml: `
      <form id="admin-users-filter" class="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="text" name="search" placeholder="Search name, email, ID..." class="input-field sm:col-span-2" />
        <select name="role" class="input-field">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <div class="flex gap-2">
          <select name="status" class="input-field">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button type="submit" class="btn-primary px-4">Filter</button>
        </div>
      </form>
      <div id="admin-users-table">${renderLoading('Loading users...')}</div>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#admin-users-filter');
  const tableEl = root.querySelector('#admin-users-table');
  let page = 1;

  async function load() {
    tableEl.innerHTML = renderLoading('Loading users...');
    try {
      const fd = new FormData(form);
      const { users, pagination } = await getAdminUsers({
        search: fd.get('search'),
        role: fd.get('role'),
        status: fd.get('status'),
        page,
        limit: 12,
      });

      if (users.length === 0) {
        tableEl.innerHTML = renderEmptyState({
          title: 'No users found',
          description: 'Try adjusting your search or filter selection.',
        });
        return;
      }

      tableEl.innerHTML = `
        <div class="card overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-muted">
              <tr>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">University ID</th>
                <th class="px-4 py-3">Department</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${users
          .map(
            (u) => `
                <tr class="hover:bg-slate-50/70">
                  <td class="px-4 py-3">
                    <p class="font-semibold text-dark">${escapeHtml(u.full_name)}</p>
                    <p class="text-xs text-muted">${escapeHtml(u.email)}</p>
                  </td>
                  <td class="px-4 py-3 text-xs font-mono text-slate-700">${escapeHtml(u.university_id)}</td>
                  <td class="px-4 py-3 text-xs text-slate-600">${escapeHtml(u.department)}</td>
                  <td class="px-4 py-3">${renderBadge(u.role)}</td>
                  <td class="px-4 py-3">${renderBadge(u.account_status)}</td>
                  <td class="px-4 py-3 text-right">
                    ${u.id === store.user?.id
                ? `<span class="text-xs text-muted">Current Admin</span>`
                : u.account_status === 'ACTIVE'
                  ? `<button type="button" data-user-id="${u.id}" data-next-status="SUSPENDED" class="btn-danger py-1 px-2.5 text-xs">Suspend</button>`
                  : `<button type="button" data-user-id="${u.id}" data-next-status="ACTIVE" class="btn-success py-1 px-2.5 text-xs">Reactivate</button>`
              }
                  </td>
                </tr>`
          )
          .join('')}
            </tbody>
          </table>
        </div>
        ${renderPagination(pagination)}
      `;

      bindPagination(tableEl, (next) => {
        page = next;
        load();
      });

      tableEl.querySelectorAll('[data-user-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const nextStatus = btn.dataset.nextStatus;
          const ok = await confirmDialog({
            title: `${nextStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} User Account`,
            message: `Are you sure you want to set this account status to ${nextStatus}?`,
            confirmText: nextStatus === 'SUSPENDED' ? 'Suspend User' : 'Reactivate User',
            confirmStyle: nextStatus === 'SUSPENDED' ? 'danger' : 'success',
          });
          if (!ok) return;
          try {
            await updateAdminUserStatus(btn.dataset.userId, nextStatus);
            showToast(`Account updated to ${nextStatus}.`, 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      tableEl.innerHTML = renderErrorState(err.message);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    page = 1;
    load();
  });

  await load();
}

export async function renderAdminReportsPage(root, { query = {} } = {}) {
  root.innerHTML = renderDashboardShell({
    title: 'Report Management',
    subtitle: 'Moderate pending lost/found reports, confirm returns, or remove invalid submissions.',
    activePath: '/admin/reports',
    isAdmin: true,
    contentHtml: `
      <form id="admin-items-filter" class="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <input type="text" name="search" placeholder="Search item, location, reporter..." class="input-field lg:col-span-2" />
        <select name="type" class="input-field">
          <option value="">All Types</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
        </select>
        <select name="moderation_status" class="input-field">
          <option value="">All Moderation</option>
          <option value="PENDING_REVIEW" ${query.moderation_status === 'PENDING_REVIEW' ? 'selected' : ''}>Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select name="category" id="admin-items-cat" class="input-field">
          <option value="">All Categories</option>
        </select>
        <button type="submit" class="btn-primary">Filter</button>
      </form>
      <div id="admin-items-list">${renderLoading('Loading reports...')}</div>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#admin-items-filter');
  const catSelect = root.querySelector('#admin-items-cat');
  const listEl = root.querySelector('#admin-items-list');
  let page = 1;

  try {
    const cats = await getCategories();
    cats.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
  } catch {
    // ignore
  }

  async function load() {
    listEl.innerHTML = renderLoading('Loading reports...');
    try {
      const fd = new FormData(form);
      const { items, pagination } = await getAdminItems({
        search: fd.get('search'),
        type: fd.get('type'),
        moderation_status: fd.get('moderation_status'),
        category: fd.get('category'),
        page,
        limit: 10,
      });

      if (items.length === 0) {
        listEl.innerHTML = renderEmptyState({
          title: 'No reports match these filters',
          description: 'Try clearing filters to inspect all campus item reports.',
        });
        return;
      }

      listEl.innerHTML = `
        <div class="space-y-4">
          ${items
          .map(
            (item) => `
            <div class="card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1.5 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  ${renderBadge(item.report_type)}
                  ${renderBadge(item.moderation_status)}
                  ${renderBadge(item.resolution_status)}
                  <span class="text-xs text-muted">#${item.id} &bull; ${escapeHtml(item.category_name)}</span>
                </div>
                <h3 class="text-base font-bold text-dark">
                  <a href="/items/${item.id}" data-link class="hover:text-primary transition">${escapeHtml(item.item_name)}</a>
                </h3>
                <p class="text-xs text-slate-600 line-clamp-2">${escapeHtml(item.description)}</p>
                <p class="text-xs text-muted">
                  Location: <span class="font-medium text-dark">${escapeHtml(item.location)}</span> &bull;
                  Date: ${formatDate(item.event_date)} &bull;
                  Reporter: ${escapeHtml(item.reporter_name)} (${escapeHtml(item.reporter_email)})
                </p>
                ${item.rejection_reason
                ? `<p class="text-xs text-danger font-medium">Rejection reason: ${escapeHtml(item.rejection_reason)}</p>`
                : ''
              }
              </div>

              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <a href="/items/${item.id}" data-link class="btn-secondary py-1.5 px-3 text-xs">View</a>
                ${item.moderation_status !== 'APPROVED'
                ? `<button type="button" data-approve-item="${item.id}" class="btn-success py-1.5 px-3 text-xs">Approve</button>`
                : ''
              }
                ${item.moderation_status !== 'REJECTED'
                ? `<button type="button" data-reject-item="${item.id}" class="btn bg-amber-500 text-white hover:bg-amber-600 py-1.5 px-3 text-xs">Reject</button>`
                : ''
              }
                ${item.moderation_status === 'APPROVED' && item.resolution_status !== 'RETURNED'
                ? `<button type="button" data-return-item="${item.id}" class="btn-primary py-1.5 px-3 text-xs">Mark Returned</button>`
                : ''
              }
                <button type="button" data-delete-item="${item.id}" class="btn-danger py-1.5 px-3 text-xs">Delete</button>
              </div>
            </div>`
          )
          .join('')}
        </div>
        ${renderPagination(pagination)}
      `;

      bindPagination(listEl, (next) => {
        page = next;
        load();
      });

      listEl.querySelectorAll('[data-approve-item]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await approveAdminItem(btn.dataset.approveItem);
            showToast('Report approved and published.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-reject-item]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const reason = await promptDialog({
            title: 'Reject Item Report',
            message: 'Provide a clear reason that will be sent to the reporter.',
            label: 'Rejection Reason',
            placeholder: 'e.g. Insufficient item description or duplicate submission...',
            confirmText: 'Reject Report',
            confirmStyle: 'danger',
          });
          if (!reason) return;
          try {
            await rejectAdminItem(btn.dataset.rejectItem, reason);
            showToast('Report rejected.', 'info');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-return-item]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Confirm Item Return',
            message: 'Mark this item as RETURNED and complete any approved claim associated with it?',
            confirmText: 'Confirm Return',
            confirmStyle: 'success',
          });
          if (!ok) return;
          try {
            await markAdminItemReturned(btn.dataset.returnItem);
            showToast('Item marked as RETURNED.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-delete-item]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Delete Item Report',
            message: 'Permanently delete this report and any associated claims?',
            confirmText: 'Delete',
            confirmStyle: 'danger',
          });
          if (!ok) return;
          try {
            await deleteAdminItem(btn.dataset.deleteItem);
            showToast('Report deleted.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = renderErrorState(err.message);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    page = 1;
    load();
  });

  await load();
}

export async function renderAdminClaimsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Claim Management',
    subtitle: 'Review private ownership proofs, approve or reject claims, and confirm safe item returns.',
    activePath: '/admin/claims',
    isAdmin: true,
    contentHtml: `
      <form id="admin-claims-filter" class="card p-4 mb-6 flex flex-wrap items-center gap-3">
        <input type="text" name="search" placeholder="Search item, claimant..." class="input-field flex-1 min-w-[200px]" />
        <select name="status" class="input-field w-48">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
        <button type="submit" class="btn-primary">Filter</button>
      </form>
      <div id="admin-claims-list">${renderLoading('Loading ownership claims...')}</div>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#admin-claims-filter');
  const listEl = root.querySelector('#admin-claims-list');
  let page = 1;

  async function load() {
    listEl.innerHTML = renderLoading('Loading ownership claims...');
    try {
      const fd = new FormData(form);
      const { claims, pagination } = await getAdminClaims({
        search: fd.get('search'),
        status: fd.get('status'),
        page,
        limit: 10,
      });

      if (claims.length === 0) {
        listEl.innerHTML = renderEmptyState({
          title: 'No ownership claims found',
          description: 'No claims match the selected filters.',
        });
        return;
      }

      listEl.innerHTML = `
        <div class="space-y-4">
          ${claims
          .map(
            (c) => `
            <div class="card p-5 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    ${renderBadge(c.status)}
                    ${renderBadge(c.resolution_status)}
                    <span class="text-xs text-muted">Claim #${c.id} &bull; ${formatDateTime(c.created_at)}</span>
                  </div>
                  <h3 class="text-base font-bold text-dark">
                    <a href="/items/${c.item_id}" data-link class="hover:text-primary transition">${escapeHtml(c.item_name)}</a>
                  </h3>
                  <p class="text-xs text-muted">
                    Claimant: <span class="font-semibold text-dark">${escapeHtml(c.claimant_name)}</span> (${escapeHtml(c.claimant_email)}, ${escapeHtml(c.claimant_uni_id)}) &bull; Finder: ${escapeHtml(c.finder_name)}
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                  ${c.has_evidence
                ? `<a href="${escapeHtml(resolveAssetUrl(`/api/v1/claims/${c.id}/evidence`))}" target="_blank" rel="noopener noreferrer" class="btn-secondary py-1.5 px-3 text-xs">View Evidence</a>`
                : ''
              }
                  ${c.status === 'PENDING'
                ? `<button type="button" data-approve-claim="${c.id}" class="btn-success py-1.5 px-3 text-xs">Approve Claim</button>
                         <button type="button" data-reject-claim="${c.id}" class="btn-danger py-1.5 px-3 text-xs">Reject</button>`
                : ''
              }
                  ${c.status === 'APPROVED'
                ? `<button type="button" data-complete-claim="${c.id}" class="btn-primary py-1.5 px-3 text-xs">Confirm Safe Return</button>`
                : ''
              }
                </div>
              </div>

              <div class="rounded-lg bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-700 space-y-1.5">
                <p><span class="font-bold text-dark">Ownership Explanation:</span> ${escapeHtml(c.explanation)}</p>
                <p><span class="font-bold text-dark">Private Identifying Details:</span> ${escapeHtml(c.identifying_details)}</p>
                ${c.admin_notes
                ? `<p class="pt-1 text-primary font-medium"><span class="font-bold">Admin Notes:</span> ${escapeHtml(c.admin_notes)}</p>`
                : ''
              }
              </div>
            </div>`
          )
          .join('')}
        </div>
        ${renderPagination(pagination)}
      `;

      bindPagination(listEl, (next) => {
        page = next;
        load();
      });

      listEl.querySelectorAll('[data-approve-claim]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const notes = await promptDialog({
            title: 'Approve Ownership Claim',
            message: 'Add pickup instructions or verification notes for the claimant.',
            label: 'Verification / Pickup Notes',
            placeholder: 'e.g. Ownership verified. Collect at Student Center Room 104 with University ID.',
            required: false,
            confirmText: 'Approve Claim',
            confirmStyle: 'success',
          });
          if (notes === null) return;
          try {
            await approveAdminClaim(btn.dataset.approveClaim, notes);
            showToast('Claim approved! Item status updated to CLAIMED.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-reject-claim]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const notes = await promptDialog({
            title: 'Reject Ownership Claim',
            message: 'Explain why the verification proof could not be matched.',
            label: 'Rejection Notes',
            placeholder: 'e.g. Serial number / color details did not match item on hand.',
            required: true,
            confirmText: 'Reject Claim',
            confirmStyle: 'danger',
          });
          if (!notes) return;
          try {
            await rejectAdminClaim(btn.dataset.rejectClaim, notes);
            showToast('Claim rejected.', 'info');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-complete-claim]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Confirm Safe Return',
            message: 'Confirm that the item has been physically handed over to the verified owner? This updates the item status to RETURNED.',
            confirmText: 'Confirm Return',
            confirmStyle: 'success',
          });
          if (!ok) return;
          try {
            await completeAdminClaimReturn(btn.dataset.completeClaim, 'Handover completed with ID verification.');
            showToast('Item return confirmed and completed!', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = renderErrorState(err.message);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    page = 1;
    load();
  });

  await load();
}

export async function renderAdminCategoriesPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Category Management',
    subtitle: 'Organize campus Lost & Found item categories.',
    activePath: '/admin/categories',
    isAdmin: true,
    contentHtml: `
      <form id="create-category-form" class="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div class="sm:col-span-4">
          <label for="cat-name" class="form-label">New Category Name *</label>
          <input id="cat-name" name="name" type="text" required minlength="2" maxlength="80" placeholder="e.g. Musical Instruments" class="input-field" />
        </div>
        <div class="sm:col-span-6">
          <label for="cat-desc" class="form-label">Description</label>
          <input id="cat-desc" name="description" type="text" maxlength="255" placeholder="Short description of items in this category" class="input-field" />
        </div>
        <div class="sm:col-span-2">
          <button type="submit" class="btn-primary w-full">Add Category</button>
        </div>
      </form>
      <div id="admin-categories-list">${renderLoading('Loading categories...')}</div>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#create-category-form');
  const listEl = root.querySelector('#admin-categories-list');

  async function load() {
    listEl.innerHTML = renderLoading('Loading categories...');
    try {
      const categories = await getAdminCategories();
      listEl.innerHTML = `
        <div class="card overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-muted">
              <tr>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Reports</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${categories
          .map(
            (c) => `
                <tr>
                  <td class="px-4 py-3 font-semibold text-dark">${escapeHtml(c.name)}</td>
                  <td class="px-4 py-3 text-xs text-muted">${escapeHtml(c.description || '—')}</td>
                  <td class="px-4 py-3 text-xs font-semibold text-dark">${c.item_count}</td>
                  <td class="px-4 py-3 text-right space-x-2">
                    <button type="button" data-edit-cat="${c.id}" data-cat-name="${escapeHtml(c.name)}" data-cat-desc="${escapeHtml(c.description || '')}" class="btn-secondary py-1 px-2.5 text-xs">Rename</button>
                    <button type="button" data-delete-cat="${c.id}" class="btn-danger py-1 px-2.5 text-xs">Delete</button>
                  </td>
                </tr>`
          )
          .join('')}
            </tbody>
          </table>
        </div>
      `;

      listEl.querySelectorAll('[data-edit-cat]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const newName = await promptDialog({
            title: 'Rename Category',
            message: `Current name: ${btn.dataset.catName}`,
            label: 'New Category Name',
            placeholder: btn.dataset.catName,
            confirmText: 'Update Category',
          });
          if (!newName) return;
          try {
            await updateAdminCategory(btn.dataset.editCat, {
              name: newName,
              description: btn.dataset.catDesc,
            });
            showToast('Category updated.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-delete-cat]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category?',
            confirmText: 'Delete',
            confirmStyle: 'danger',
          });
          if (!ok) return;
          try {
            await deleteAdminCategory(btn.dataset.deleteCat);
            showToast('Category deleted.', 'success');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = renderErrorState(err.message);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await createAdminCategory({
        name: form.name.value.trim(),
        description: form.description.value.trim(),
      });
      form.reset();
      showToast('Category created.', 'success');
      load();
    } catch (err) {
      showToast(extractFormErrorMessage(err), 'error');
    }
  });

  await load();
}

export async function renderAdminActivityLogsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Activity Logs',
    subtitle: 'Immutable audit trail of administrator moderation, claim verification, and user actions.',
    activePath: '/admin/activity-logs',
    isAdmin: true,
    contentHtml: `
      <form id="admin-logs-filter" class="card p-4 mb-6 flex flex-wrap gap-3">
        <input type="text" name="action" placeholder="Filter by action (e.g. ITEM_APPROVED)..." class="input-field flex-1 min-w-[200px]" />
        <select name="target_type" class="input-field w-44">
          <option value="">All Targets</option>
          <option value="ITEM">Items</option>
          <option value="CLAIM">Claims</option>
          <option value="USER">Users</option>
          <option value="CATEGORY">Categories</option>
          <option value="SYSTEM">System</option>
        </select>
        <button type="submit" class="btn-primary">Filter</button>
      </form>
      <div id="admin-logs-table">${renderLoading('Loading activity logs...')}</div>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#admin-logs-filter');
  const tableEl = root.querySelector('#admin-logs-table');
  let page = 1;

  async function load() {
    tableEl.innerHTML = renderLoading('Loading activity logs...');
    try {
      const fd = new FormData(form);
      const { logs, pagination } = await getAdminActivityLogs({
        action: fd.get('action'),
        target_type: fd.get('target_type'),
        page,
        limit: 15,
      });

      if (logs.length === 0) {
        tableEl.innerHTML = renderEmptyState({
          title: 'No activity logs found',
          description: 'Administrative actions will be recorded here automatically.',
        });
        return;
      }

      tableEl.innerHTML = `
        <div class="card overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-muted">
              <tr>
                <th class="px-4 py-3">Timestamp</th>
                <th class="px-4 py-3">Admin</th>
                <th class="px-4 py-3">Action</th>
                <th class="px-4 py-3">Target</th>
                <th class="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-xs">
              ${logs
          .map(
            (l) => `
                <tr>
                  <td class="px-4 py-3 text-muted whitespace-nowrap">${formatDateTime(l.created_at)}</td>
                  <td class="px-4 py-3 font-medium text-dark">${escapeHtml(l.admin_name)}</td>
                  <td class="px-4 py-3 font-mono font-semibold text-primary">${escapeHtml(l.action)}</td>
                  <td class="px-4 py-3 text-slate-600">${escapeHtml(l.target_type)}${l.target_id ? ` #${l.target_id}` : ''}</td>
                  <td class="px-4 py-3 text-slate-700">${escapeHtml(l.details || '—')}</td>
                </tr>`
          )
          .join('')}
            </tbody>
          </table>
        </div>
        ${renderPagination(pagination)}
      `;

      bindPagination(tableEl, (next) => {
        page = next;
        load();
      });
    } catch (err) {
      tableEl.innerHTML = renderErrorState(err.message);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    page = 1;
    load();
  });

  await load();
}

export async function renderAdminSettingsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'System Settings & Announcements',
    subtitle: 'Configure campus Lost & Found desk metadata and broadcast campus-wide announcements.',
    activePath: '/admin/settings',
    isAdmin: true,
    contentHtml: renderLoading('Loading system settings...'),
  });
  bindShellEvents(root);

  const content = root.querySelector('#dashboard-content');
  try {
    const settings = await getAdminSettings();
    const val = (k, fallback = '') => settings[k]?.value ?? fallback;

    content.innerHTML = `
      <div class="space-y-8">
        <form id="admin-settings-form" class="card p-6 sm:p-8 space-y-5">
          <h2 class="text-lg font-bold text-dark">Portal &amp; Desk Configuration</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label for="set-campus" class="form-label">Campus / Institution Name</label>
              <input id="set-campus" name="campus_name" type="text" value="${escapeHtml(val('campus_name'))}" class="input-field" />
            </div>
            <div>
              <label for="set-email" class="form-label">Support Email</label>
              <input id="set-email" name="support_email" type="email" value="${escapeHtml(val('support_email'))}" class="input-field" />
            </div>
            <div>
              <label for="set-desk" class="form-label">Lost &amp; Found Desk Location</label>
              <input id="set-desk" name="lost_found_desk_location" type="text" value="${escapeHtml(val('lost_found_desk_location'))}" class="input-field" />
            </div>
            <div>
              <label for="set-hours" class="form-label">Desk Office Hours</label>
              <input id="set-hours" name="desk_office_hours" type="text" value="${escapeHtml(val('desk_office_hours'))}" class="input-field" />
            </div>
            <div>
              <label for="set-hold" class="form-label">Unclaimed Hold Duration (Days)</label>
              <input id="set-hold" name="claim_hold_days" type="number" min="1" max="365" value="${escapeHtml(val('claim_hold_days', '30'))}" class="input-field" />
            </div>
            <div>
              <label for="set-mod" class="form-label">Require Admin Moderation</label>
              <select id="set-mod" name="require_moderation_approval" class="input-field">
                <option value="true" ${val('require_moderation_approval', 'true') === 'true' ? 'selected' : ''}>Enabled (Recommended)</option>
                <option value="false" ${val('require_moderation_approval') === 'false' ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>
          <div class="pt-2 flex justify-end">
            <button type="submit" id="save-settings-btn" class="btn-primary">Save Settings</button>
          </div>
        </form>

        <form id="admin-announcement-form" class="card p-6 sm:p-8 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-dark">Broadcast Important Announcement</h2>
            <p class="text-xs text-muted mt-0.5">Send a notification banner to all active campus users.</p>
          </div>
          <div>
            <label for="ann-title" class="form-label">Announcement Title *</label>
            <input id="ann-title" name="title" type="text" required minlength="3" maxlength="180" placeholder="e.g. Semester-End Unclaimed Item Clearance Notice" class="input-field" />
          </div>
          <div>
            <label for="ann-msg" class="form-label">Message *</label>
            <textarea id="ann-msg" name="message" rows="3" required minlength="5" maxlength="2000" placeholder="Write the campus-wide announcement..." class="input-field"></textarea>
          </div>
          <div class="flex justify-end">
            <button type="submit" id="send-ann-btn" class="btn-secondary">Send to All Active Users</button>
          </div>
        </form>
      </div>
    `;

    const settingsForm = content.querySelector('#admin-settings-form');
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = content.querySelector('#save-settings-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        const fd = new FormData(settingsForm);
        const payload = Object.fromEntries(fd.entries());
        await updateAdminSettings(payload);
        showToast('System settings saved.', 'success');
      } catch (err) {
        showToast(extractFormErrorMessage(err), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Settings';
      }
    });

    const annForm = content.querySelector('#admin-announcement-form');
    annForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = content.querySelector('#send-ann-btn');
      btn.disabled = true;
      btn.textContent = 'Broadcasting...';
      try {
        const res = await broadcastAdminAnnouncement({
          title: annForm.title.value.trim(),
          message: annForm.message.value.trim(),
        });
        annForm.reset();
        showToast(res.message || 'Announcement sent.', 'success');
      } catch (err) {
        showToast(extractFormErrorMessage(err), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send to All Active Users';
      }
    });
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
  }
}
