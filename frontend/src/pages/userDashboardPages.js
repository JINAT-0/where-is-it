import { bindShellEvents, renderDashboardShell } from '../components/dashboardShell.js';
import { resolveAssetUrl } from '../js/api.js';
import { getMyClaims, withdrawClaim } from '../js/claims.js';
import {
  changePassword,
  getProfile,
  getUserDashboard,
  updateProfile,
} from '../js/dashboard.js';
import {
  createItem,
  deleteItem,
  getCategories,
  getItemById,
  getMyItems,
  updateItem,
} from '../js/items.js';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../js/notifications.js';
import { navigate } from '../js/router.js';
import {
  bindPagination,
  confirmDialog,
  escapeHtml,
  extractFormErrorMessage,
  formatDate,
  formatDateTime,
  renderBadge,
  renderEmptyState,
  renderErrorState,
  renderLoading,
  renderPagination,
  showToast,
} from '../js/utils.js';

export async function renderUserOverviewPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Dashboard Overview',
    subtitle: 'Track your lost & found reports, ownership claims, and campus notifications.',
    activePath: '/dashboard',
    contentHtml: renderLoading('Loading your dashboard...'),
  });
  bindShellEvents(root);

  const content = root.querySelector('#dashboard-content');
  try {
    const { stats, recentItems, recentClaims } = await getUserDashboard();
    content.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">My Reports</p>
          <p class="mt-2 text-2xl font-extrabold text-dark">${stats.total_reports}</p>
          <p class="mt-1 text-xs text-muted">${stats.lost_reports} Lost &bull; ${stats.found_reports} Found</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Pending Review</p>
          <p class="mt-2 text-2xl font-extrabold text-warning">${stats.pending_review_reports}</p>
          <p class="mt-1 text-xs text-muted">Awaiting admin approval</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">My Claims</p>
          <p class="mt-2 text-2xl font-extrabold text-primary">${stats.total_claims}</p>
          <p class="mt-1 text-xs text-muted">${stats.pending_claims} Pending &bull; ${stats.approved_claims} Approved</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-muted uppercase">Returned Items</p>
          <p class="mt-2 text-2xl font-extrabold text-success">${stats.returned_reports + stats.completed_claims}</p>
          <p class="mt-1 text-xs text-muted">${stats.unread_notifications} Unread alerts</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-8">
        <a href="/dashboard/report-lost" data-link class="btn-primary">+ Report Lost Item</a>
        <a href="/dashboard/report-found" data-link class="btn-secondary">+ Report Found Item</a>
        <a href="/found-items" data-link class="btn-secondary">Search Found Items</a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-dark">Recent Reports</h2>
            <a href="/dashboard/my-reports" data-link class="text-xs font-semibold text-primary hover:underline">View all</a>
          </div>
          ${recentItems.length === 0
        ? `<p class="text-sm text-muted py-4">You haven't submitted any reports yet.</p>`
        : `<div class="space-y-3">
                  ${recentItems
          .map(
            (i) => `
                    <a href="/items/${i.id}" data-link class="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-semibold text-dark truncate">${escapeHtml(i.item_name)}</span>
                        ${renderBadge(i.moderation_status)}
                      </div>
                      <p class="mt-1 text-xs text-muted">${escapeHtml(i.report_type)} &bull; ${escapeHtml(i.location)} &bull; ${formatDate(i.event_date)}</p>
                    </a>`
          )
          .join('')}
                </div>`
      }
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-dark">Recent Claims</h2>
            <a href="/dashboard/my-claims" data-link class="text-xs font-semibold text-primary hover:underline">View all</a>
          </div>
          ${recentClaims.length === 0
        ? `<p class="text-sm text-muted py-4">You haven't submitted any ownership claims yet.</p>`
        : `<div class="space-y-3">
                  ${recentClaims
          .map(
            (c) => `
                    <a href="/items/${c.item_id}" data-link class="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-semibold text-dark truncate">${escapeHtml(c.item_name)}</span>
                        ${renderBadge(c.status)}
                      </div>
                      <p class="mt-1 text-xs text-muted">${escapeHtml(c.location)} &bull; ${formatDateTime(c.created_at)}</p>
                    </a>`
          )
          .join('')}
                </div>`
      }
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
  }
}

export async function renderReportItemPage(root, { reportType = 'LOST', editItemId = null } = {}) {
  const isEdit = Boolean(editItemId);
  let activeType = reportType;
  let existingItem = null;

  const activePath = isEdit
    ? '/dashboard/my-reports'
    : activeType === 'FOUND'
      ? '/dashboard/report-found'
      : '/dashboard/report-lost';

  root.innerHTML = renderDashboardShell({
    title: isEdit
      ? 'Edit Item Report'
      : activeType === 'FOUND'
        ? 'Report Found Item'
        : 'Report Lost Item',
    subtitle: isEdit
      ? 'Update your report details. Edited reports are reviewed by an administrator.'
      : activeType === 'FOUND'
        ? 'Log an item you found on campus so its rightful owner can claim it safely.'
        : 'Provide accurate details so fellow campus members and staff can help locate your item.',
    activePath,
    contentHtml: renderLoading('Preparing report form...'),
  });
  bindShellEvents(root);

  const content = root.querySelector('#dashboard-content');
  try {
    const categories = await getCategories();
    if (isEdit) {
      existingItem = await getItemById(editItemId);
      activeType = existingItem.report_type;
    }

    const isFound = activeType === 'FOUND';
    const today = new Date().toISOString().slice(0, 10);

    content.innerHTML = `
      <form id="item-report-form" class="card p-6 sm:p-8 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="item-name" class="form-label">Item Name *</label>
            <input id="item-name" name="item_name" type="text" required minlength="2" maxlength="150"
              value="${escapeHtml(existingItem?.item_name || '')}"
              placeholder="e.g. Black Dell Laptop Charger" class="input-field" />
          </div>
          <div>
            <label for="item-category" class="form-label">Category *</label>
            <select id="item-category" name="category_id" required class="input-field">
              <option value="">Select a category</option>
              ${categories
        .map(
          (c) =>
            `<option value="${c.id}" ${String(existingItem?.category_id) === String(c.id) ? 'selected' : ''
            }>${escapeHtml(c.name)}</option>`
        )
        .join('')}
            </select>
          </div>
        </div>

        <div>
          <label for="item-description" class="form-label">Detailed Description *</label>
          <textarea id="item-description" name="description" rows="4" required minlength="10" maxlength="3000"
            placeholder="Describe color, brand, size, stickers, or condition (keep sensitive serial numbers private for claim verification)..."
            class="input-field">${escapeHtml(existingItem?.description || '')}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="sm:col-span-1">
            <label for="item-location" class="form-label">${isFound ? 'Found Location *' : 'Location Lost *'}</label>
            <input id="item-location" name="location" type="text" required minlength="2" maxlength="180"
              value="${escapeHtml(existingItem?.location || '')}"
              placeholder="e.g. Central Library 2F" class="input-field" />
          </div>
          <div>
            <label for="item-date" class="form-label">${isFound ? 'Date Found *' : 'Date Lost *'}</label>
            <input id="item-date" name="event_date" type="date" required max="${today}"
              value="${escapeHtml(existingItem?.event_date || today)}" class="input-field" />
          </div>
          <div>
            <label for="item-time" class="form-label">Approximate Time</label>
            <input id="item-time" name="approximate_time" type="text" maxlength="50"
              value="${escapeHtml(existingItem?.approximate_time || '')}"
              placeholder="e.g. 02:30 PM" class="input-field" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="item-contact" class="form-label">${isFound ? 'Safe Contact / Handover Method *' : 'Contact Information *'}</label>
            <input id="item-contact" name="contact_info" type="text" required maxlength="180"
              value="${escapeHtml(existingItem?.contact_info || '')}"
              placeholder="${isFound ? 'e.g. Deposited at Campus Security Desk' : 'e.g. Campus email or Student Center Desk'}"
              class="input-field" />
          </div>
          <div>
            <label for="item-image" class="form-label">Item Image (JPG, PNG, WebP up to 5MB)</label>
            <input id="item-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp"
              class="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3.5 file:py-2.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary-100" />
            ${existingItem?.image_path
        ? `<p class="mt-1.5 text-xs text-muted">Current photo attached. Upload a new one to replace it.</p>`
        : ''
      }
          </div>
        </div>

        ${existingItem?.image_path
        ? `<div class="w-44 rounded-lg overflow-hidden border border-slate-200">
                <img src="${escapeHtml(resolveAssetUrl(existingItem.image_path))}" alt="Current item" class="w-full h-28 object-cover" />
              </div>`
        : ''
      }

        <div id="report-form-error" class="hidden rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-danger"></div>

        <div class="pt-2 flex flex-wrap items-center justify-end gap-3">
          <a href="/dashboard/my-reports" data-link class="btn-secondary">Cancel</a>
          <button type="submit" id="report-submit-btn" class="btn-primary">
            ${isEdit ? 'Save Changes' : `Submit ${isFound ? 'Found' : 'Lost'} Report`}
          </button>
        </div>
      </form>
    `;

    const form = content.querySelector('#item-report-form');
    const errBox = content.querySelector('#report-form-error');
    const submitBtn = content.querySelector('#report-submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? 'Saving...' : 'Submitting...';

      try {
        const fd = new FormData(form);
        if (!isEdit) {
          fd.set('report_type', activeType);
        }
        if (!fd.get('image')?.size) {
          fd.delete('image');
        }

        if (isEdit) {
          await updateItem(editItemId, fd);
          showToast('Report updated and queued for review.', 'success');
        } else {
          await createItem(fd);
          showToast('Report submitted! It will appear publicly once approved by an admin.', 'success');
        }
        navigate('/dashboard/my-reports');
      } catch (err) {
        errBox.textContent = extractFormErrorMessage(err);
        errBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit
          ? 'Save Changes'
          : `Submit ${isFound ? 'Found' : 'Lost'} Report`;
      }
    });
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
  }
}

export async function renderMyReportsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'My Reports',
    subtitle: 'Manage your submitted lost and found item reports and check moderation status.',
    activePath: '/dashboard/my-reports',
    contentHtml: `
      <div class="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <select id="my-reports-type" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-dark">
            <option value="">All Types</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>
          <select id="my-reports-status" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-dark">
            <option value="">All Moderation States</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div class="flex gap-2">
          <a href="/dashboard/report-lost" data-link class="btn-primary py-2 px-3 text-xs">+ Lost Item</a>
          <a href="/dashboard/report-found" data-link class="btn-secondary py-2 px-3 text-xs">+ Found Item</a>
        </div>
      </div>
      <div id="my-reports-list">${renderLoading('Loading your reports...')}</div>
    `,
  });
  bindShellEvents(root);

  const listEl = root.querySelector('#my-reports-list');
  const typeSel = root.querySelector('#my-reports-type');
  const statusSel = root.querySelector('#my-reports-status');
  let page = 1;

  async function load() {
    listEl.innerHTML = renderLoading('Loading your reports...');
    try {
      const { items, pagination } = await getMyItems({
        type: typeSel.value,
        status: statusSel.value,
        page,
        limit: 8,
      });

      if (items.length === 0) {
        listEl.innerHTML = renderEmptyState({
          title: 'No reports found',
          description: 'You have not submitted any reports matching these filters.',
          actionHtml: `<a href="/dashboard/report-lost" data-link class="btn-primary">Submit a Report</a>`,
        });
        return;
      }

      listEl.innerHTML = `
        <div class="space-y-4">
          ${items
          .map(
            (item) => `
            <div class="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-1.5 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  ${renderBadge(item.report_type)}
                  ${renderBadge(item.moderation_status)}
                  ${renderBadge(item.resolution_status)}
                </div>
                <h3 class="text-base font-bold text-dark truncate">
                  <a href="/items/${item.id}" data-link class="hover:text-primary transition">${escapeHtml(item.item_name)}</a>
                </h3>
                <p class="text-xs text-muted">
                  ${escapeHtml(item.category_name)} &bull; ${escapeHtml(item.location)} &bull; ${formatDate(item.event_date)}
                </p>
                ${item.rejection_reason
                ? `<p class="text-xs text-danger font-medium mt-1">Rejection note: ${escapeHtml(item.rejection_reason)}</p>`
                : ''
              }
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <a href="/items/${item.id}" data-link class="btn-secondary py-1.5 px-3 text-xs">View</a>
                ${!['CLAIMED', 'RETURNED', 'CLOSED'].includes(item.resolution_status)
                ? `<a href="/dashboard/edit/${item.id}" data-link class="btn-secondary py-1.5 px-3 text-xs">Edit</a>`
                : ''
              }
                ${!['CLAIMED', 'RETURNED'].includes(item.resolution_status)
                ? `<button type="button" data-delete-id="${item.id}" class="btn-danger py-1.5 px-3 text-xs">Delete</button>`
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

      listEl.querySelectorAll('[data-delete-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Delete Report',
            message: 'Are you sure you want to delete this item report?',
            confirmText: 'Delete',
            confirmStyle: 'danger',
          });
          if (!ok) return;
          try {
            await deleteItem(btn.dataset.deleteId);
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

  typeSel.addEventListener('change', () => {
    page = 1;
    load();
  });
  statusSel.addEventListener('change', () => {
    page = 1;
    load();
  });

  await load();
}

export async function renderMyClaimsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'My Claims',
    subtitle: 'Track ownership claims you submitted for found items.',
    activePath: '/dashboard/my-claims',
    contentHtml: `
      <div class="card p-4 mb-6 flex items-center justify-between gap-3">
        <select id="my-claims-status" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-dark">
          <option value="">All Claim Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
        <a href="/found-items" data-link class="btn-primary py-2 px-3 text-xs">Browse Found Items</a>
      </div>
      <div id="my-claims-list">${renderLoading('Loading your claims...')}</div>
    `,
  });
  bindShellEvents(root);

  const listEl = root.querySelector('#my-claims-list');
  const statusSel = root.querySelector('#my-claims-status');
  let page = 1;

  async function load() {
    listEl.innerHTML = renderLoading('Loading your claims...');
    try {
      const { claims, pagination } = await getMyClaims({ status: statusSel.value, page, limit: 8 });
      if (claims.length === 0) {
        listEl.innerHTML = renderEmptyState({
          title: 'No ownership claims found',
          description: 'When you spot an item you lost on the Found Items page, submit a claim there to verify ownership.',
          actionHtml: `<a href="/found-items" data-link class="btn-primary">Browse Found Items</a>`,
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
                    <span class="text-xs text-muted">Claim #${c.id} &bull; ${formatDateTime(c.created_at)}</span>
                  </div>
                  <h3 class="text-base font-bold text-dark">
                    <a href="/items/${c.item_id}" data-link class="hover:text-primary transition">${escapeHtml(c.item_name)}</a>
                  </h3>
                  <p class="text-xs text-muted">${escapeHtml(c.category_name)} &bull; ${escapeHtml(c.location)}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <a href="/items/${c.item_id}" data-link class="btn-secondary py-1.5 px-3 text-xs">View Item</a>
                  ${c.has_evidence
                ? `<a href="${escapeHtml(resolveAssetUrl(`/api/v1/claims/${c.id}/evidence`))}" target="_blank" rel="noopener noreferrer" class="btn-secondary py-1.5 px-3 text-xs">View Evidence</a>`
                : ''
              }
                  ${c.status === 'PENDING'
                ? `<button type="button" data-withdraw-id="${c.id}" class="btn-danger py-1.5 px-3 text-xs">Withdraw</button>`
                : ''
              }
                </div>
              </div>
              <div class="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700 space-y-1">
                <p><span class="font-semibold text-dark">Your Explanation:</span> ${escapeHtml(c.explanation)}</p>
                <p><span class="font-semibold text-dark">Identifying Details:</span> ${escapeHtml(c.identifying_details)}</p>
                ${c.admin_notes
                ? `<p class="pt-1 text-primary font-medium"><span class="font-semibold">Admin Notes:</span> ${escapeHtml(c.admin_notes)}</p>`
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

      listEl.querySelectorAll('[data-withdraw-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog({
            title: 'Withdraw Ownership Claim',
            message: 'Are you sure you want to withdraw this pending claim?',
            confirmText: 'Withdraw Claim',
            confirmStyle: 'danger',
          });
          if (!ok) return;
          try {
            await withdrawClaim(btn.dataset.withdrawId);
            showToast('Claim withdrawn.', 'success');
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

  statusSel.addEventListener('change', () => {
    page = 1;
    load();
  });

  await load();
}

export async function renderNotificationsPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Notifications',
    subtitle: 'Stay updated on report approvals, ownership claims, item returns, and campus alerts.',
    activePath: '/dashboard/notifications',
    contentHtml: `
      <div class="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <label class="inline-flex items-center gap-2 text-xs font-medium text-dark cursor-pointer">
          <input type="checkbox" id="notif-unread-only" class="rounded border-slate-300 text-primary focus:ring-primary" />
          Show unread only
        </label>
        <button type="button" id="mark-all-read-btn" class="btn-secondary py-1.5 px-3 text-xs">Mark All as Read</button>
      </div>
      <div id="notifications-list">${renderLoading('Loading notifications...')}</div>
    `,
  });
  bindShellEvents(root);

  const listEl = root.querySelector('#notifications-list');
  const unreadToggle = root.querySelector('#notif-unread-only');
  const markAllBtn = root.querySelector('#mark-all-read-btn');
  let page = 1;

  async function load() {
    listEl.innerHTML = renderLoading('Loading notifications...');
    try {
      const { notifications, pagination } = await getNotifications({
        unread: unreadToggle.checked ? 'true' : '',
        page,
        limit: 15,
      });

      if (notifications.length === 0) {
        listEl.innerHTML = renderEmptyState({
          title: 'No notifications',
          description: unreadToggle.checked
            ? 'You have read all of your notifications.'
            : 'Notifications about your reports and claims will appear here.',
        });
        return;
      }

      listEl.innerHTML = `
        <div class="space-y-3">
          ${notifications
          .map(
            (n) => `
            <div class="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${n.is_read ? 'opacity-80' : 'border-l-4 border-l-primary bg-primary-50/20'
              }">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  ${!n.is_read ? `<span class="h-2 w-2 rounded-full bg-primary"></span>` : ''}
                  <h3 class="text-sm font-bold text-dark">${escapeHtml(n.title)}</h3>
                  <span class="text-[11px] text-muted">${formatDateTime(n.created_at)}</span>
                </div>
                <p class="text-sm text-slate-600">${escapeHtml(n.message)}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                ${n.related_item_id
                ? `<a href="/items/${n.related_item_id}" data-link class="btn-secondary py-1.5 px-3 text-xs">View Item</a>`
                : ''
              }
                ${!n.is_read
                ? `<button type="button" data-read-id="${n.id}" class="btn-ghost py-1.5 px-3 text-xs text-primary">Mark Read</button>`
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

      listEl.querySelectorAll('[data-read-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await markNotificationRead(btn.dataset.readId);
            await load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = renderErrorState(err.message);
    }
  }

  unreadToggle.addEventListener('change', () => {
    page = 1;
    load();
  });

  markAllBtn.addEventListener('click', async () => {
    try {
      await markAllNotificationsRead();
      showToast('All notifications marked as read.', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  await load();
}

export async function renderProfilePage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'My Profile',
    subtitle: 'View and update your campus profile details.',
    activePath: '/dashboard/profile',
    contentHtml: renderLoading('Loading profile...'),
  });
  bindShellEvents(root);

  const content = root.querySelector('#dashboard-content');
  try {
    const user = await getProfile();
    content.innerHTML = `
      <form id="profile-form" class="card p-6 sm:p-8 space-y-5 max-w-2xl">
        <div class="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
          ${renderBadge(user.role)}
          ${renderBadge(user.account_status)}
          <span class="text-xs text-muted">Member since ${formatDate(user.created_at)}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="prof-name" class="form-label">Full Name *</label>
            <input id="prof-name" name="full_name" type="text" required minlength="2" value="${escapeHtml(user.full_name)}" class="input-field" />
          </div>
          <div>
            <label for="prof-email" class="form-label">University Email</label>
            <input id="prof-email" type="email" disabled value="${escapeHtml(user.email)}" class="input-field bg-slate-100 text-muted cursor-not-allowed" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="prof-uid" class="form-label">University ID *</label>
            <input id="prof-uid" name="university_id" type="text" required minlength="3" value="${escapeHtml(user.university_id)}" class="input-field" />
          </div>
          <div>
            <label for="prof-dept" class="form-label">Department *</label>
            <input id="prof-dept" name="department" type="text" required minlength="2" value="${escapeHtml(user.department)}" class="input-field" />
          </div>
        </div>

        <p id="profile-error" class="hidden text-xs text-danger font-medium"></p>

        <div class="pt-2 flex justify-end">
          <button type="submit" id="profile-save-btn" class="btn-primary">Save Profile</button>
        </div>
      </form>
    `;

    const form = content.querySelector('#profile-form');
    const errEl = content.querySelector('#profile-error');
    const btn = content.querySelector('#profile-save-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await updateProfile({
          full_name: form.full_name.value.trim(),
          university_id: form.university_id.value.trim(),
          department: form.department.value.trim(),
        });
        showToast('Profile updated successfully.', 'success');
      } catch (err) {
        errEl.textContent = extractFormErrorMessage(err);
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Profile';
      }
    });
  } catch (err) {
    content.innerHTML = renderErrorState(err.message);
  }
}

export async function renderChangePasswordPage(root) {
  root.innerHTML = renderDashboardShell({
    title: 'Change Password',
    subtitle: 'Keep your campus account secure with a strong password.',
    activePath: '/dashboard/change-password',
    contentHtml: `
      <form id="change-password-form" class="card p-6 sm:p-8 space-y-5 max-w-xl">
        <div>
          <label for="cp-current" class="form-label">Current Password *</label>
          <input id="cp-current" name="current_password" type="password" required class="input-field" />
        </div>
        <div>
          <label for="cp-new" class="form-label">New Password *</label>
          <input id="cp-new" name="new_password" type="password" required minlength="8" placeholder="At least 8 characters with letters &amp; numbers" class="input-field" />
        </div>
        <div>
          <label for="cp-confirm" class="form-label">Confirm New Password *</label>
          <input id="cp-confirm" name="confirm_password" type="password" required minlength="8" class="input-field" />
        </div>

        <p id="cp-error" class="hidden text-xs text-danger font-medium"></p>

        <div class="pt-2 flex justify-end">
          <button type="submit" id="cp-submit" class="btn-primary">Update Password</button>
        </div>
      </form>
    `,
  });
  bindShellEvents(root);

  const form = root.querySelector('#change-password-form');
  const errEl = root.querySelector('#cp-error');
  const btn = root.querySelector('#cp-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    if (form.new_password.value !== form.confirm_password.value) {
      errEl.textContent = 'New passwords do not match.';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';
    try {
      await changePassword({
        current_password: form.current_password.value,
        new_password: form.new_password.value,
        confirm_password: form.confirm_password.value,
      });
      form.reset();
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      errEl.textContent = extractFormErrorMessage(err);
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });
}
