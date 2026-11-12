import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';
import { resolveAssetUrl } from '../js/api.js';
import { createClaim } from '../js/claims.js';
import { deleteItem, getItemById } from '../js/items.js';
import { navigate } from '../js/router.js';
import { store } from '../js/state.js';
import {
  confirmDialog,
  escapeHtml,
  extractFormErrorMessage,
  formatDate,
  formatDateTime,
  renderBadge,
  renderErrorState,
  renderLoading,
  showToast,
} from '../js/utils.js';

export async function renderItemDetailsPage(root, { params }) {
  const itemId = params.id;
  root.innerHTML = renderPublicShell(`
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div id="item-detail-container">${renderLoading('Loading item details...')}</div>
    </div>
  `);
  bindShellEvents(root);

  const container = root.querySelector('#item-detail-container');

  try {
    const item = await getItemById(itemId);
    const imgUrl = item.image_path ? resolveAssetUrl(item.image_path) : '';
    const isFound = item.report_type === 'FOUND';
    const isEligibleForClaim =
      isFound &&
      item.moderation_status === 'APPROVED' &&
      ['OPEN', 'MATCHED'].includes(item.resolution_status) &&
      !item.is_owner;

    container.innerHTML = `
      <div class="mb-6 flex items-center justify-between gap-4">
        <a href="${isFound ? '/found-items' : '/lost-items'}" data-link class="text-sm font-medium text-muted hover:text-dark">
          &larr; Back to ${isFound ? 'Found Items' : 'Lost Items'}
        </a>
        ${item.is_owner || store.user?.role === 'ADMIN'
        ? `<div class="flex items-center gap-2">
                ${!['CLAIMED', 'RETURNED', 'CLOSED'].includes(item.resolution_status)
          ? `<a href="/dashboard/edit/${item.id}" data-link class="btn-secondary py-1.5 px-3 text-xs">Edit Report</a>`
          : ''
        }
                ${!['CLAIMED', 'RETURNED'].includes(item.resolution_status) || store.user?.role === 'ADMIN'
          ? `<button type="button" id="delete-item-btn" class="btn-danger py-1.5 px-3 text-xs">Delete</button>`
          : ''
        }
              </div>`
        : ''
      }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Image & Details -->
        <div class="lg:col-span-7 space-y-6">
          <div class="card overflow-hidden">
            <div class="aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden">
              ${imgUrl
        ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.item_name)}" class="w-full h-full object-cover" />`
        : `<div class="text-center text-slate-400 p-8">
                      <svg class="w-14 h-14 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p class="text-sm font-medium">No photo uploaded for this report</p>
                    </div>`
      }
            </div>
            <div class="p-6">
              <div class="flex flex-wrap items-center gap-2 mb-3">
                ${renderBadge(item.report_type)}
                ${renderBadge(item.resolution_status)}
                ${item.moderation_status !== 'APPROVED' ? renderBadge(item.moderation_status) : ''}
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-dark">${escapeHtml(item.item_name)}</h1>
              <p class="mt-1 text-sm font-medium text-primary">${escapeHtml(item.category_name)}</p>

              <div class="mt-5 pt-5 border-t border-slate-100">
                <h2 class="text-xs font-bold uppercase tracking-wider text-muted">Description</h2>
                <p class="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">${escapeHtml(item.description)}</p>
              </div>

              ${item.rejection_reason
        ? `<div class="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                      <p class="text-xs font-bold text-danger uppercase">Rejection Reason</p>
                      <p class="mt-1 text-sm text-red-800">${escapeHtml(item.rejection_reason)}</p>
                    </div>`
        : ''
      }
            </div>
          </div>
        </div>

        <!-- Right Metadata & Claim Action -->
        <div class="lg:col-span-5 space-y-6">
          <div class="card p-6 space-y-4">
            <h2 class="text-base font-bold text-dark">Report Information</h2>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2.5">
                <dt class="text-muted">Campus Location</dt>
                <dd class="font-semibold text-dark text-right">${escapeHtml(item.location)}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2.5">
                <dt class="text-muted">Date ${isFound ? 'Found' : 'Lost'}</dt>
                <dd class="font-semibold text-dark">${formatDate(item.event_date)}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2.5">
                <dt class="text-muted">Approximate Time</dt>
                <dd class="font-semibold text-dark">${escapeHtml(item.approximate_time || 'Not specified')}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2.5">
                <dt class="text-muted">Reported By</dt>
                <dd class="font-semibold text-dark text-right">
                  ${escapeHtml(item.reporter_name)}
                  <span class="block text-xs font-normal text-muted">${escapeHtml(item.reporter_department)} (${escapeHtml(item.reporter_role)})</span>
                </dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-2.5">
                <dt class="text-muted">Published</dt>
                <dd class="text-slate-600 text-right">${formatDateTime(item.created_at)}</dd>
              </div>
              <div>
                <dt class="text-muted mb-1">Contact / Handover Note</dt>
                <dd class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                  ${item.contact_info
        ? escapeHtml(item.contact_info)
        : store.user
          ? 'Coordinated securely through the Campus Lost &amp; Found Desk.'
          : 'Sign in with your campus account to view safe contact or submit a claim.'
      }
                </dd>
              </div>
            </dl>
          </div>

          <!-- Ownership Claim Box -->
          ${isFound
        ? `<div class="card p-6">
                  <h2 class="text-base font-bold text-dark">Ownership Claim</h2>
                  ${item.resolution_status === 'RETURNED'
          ? `<p class="mt-2 text-sm text-success font-medium">This item has already been verified and safely returned to its owner.</p>`
          : item.resolution_status === 'CLAIMED'
            ? `<p class="mt-2 text-sm text-amber-700 font-medium">An ownership claim for this item has been approved and is awaiting final handover.</p>`
            : item.is_owner
              ? `<p class="mt-2 text-sm text-muted">You submitted this found item report. Administrators will notify you when a verified claim is approved.</p>`
              : item.user_claim
                ? `<div class="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-4">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-primary uppercase">Your Claim Status</span>
                            ${renderBadge(item.user_claim.status)}
                          </div>
                          <p class="mt-2 text-xs text-slate-700">Submitted on ${formatDateTime(item.user_claim.created_at)}. Track updates in your dashboard.</p>
                          <a href="/dashboard/my-claims" data-link class="btn-secondary mt-3 w-full text-xs">View My Claims</a>
                        </div>`
                : !store.user
                  ? `<p class="mt-2 text-sm text-muted">Think this item belongs to you? Log in with your university account to submit a private ownership verification claim.</p>
                         <a href="/login?redirect=${encodeURIComponent(`/items/${item.id}`)}" data-link class="btn-primary mt-4 w-full">Log In to Claim Item</a>`
                  : isEligibleForClaim
                    ? `<p class="mt-1.5 text-xs text-muted">Provide private details only the true owner would know. Your proof is strictly confidential to administrators.</p>
                         <form id="claim-form" class="mt-4 space-y-4">
                           <div>
                             <label for="claim-explanation" class="form-label">Explanation of Ownership *</label>
                             <textarea id="claim-explanation" name="explanation" rows="3" required minlength="10" class="input-field" placeholder="Describe when and where you lost this item..."></textarea>
                           </div>
                           <div>
                             <label for="claim-details" class="form-label">Identifying Details *</label>
                             <textarea id="claim-details" name="identifying_details" rows="3" required minlength="5" class="input-field" placeholder="Unique marks, serial number, wallpaper, contents inside..."></textarea>
                           </div>
                           <div>
                             <label for="claim-evidence" class="form-label">Supporting Evidence (Optional Image)</label>
                             <input id="claim-evidence" name="evidence" type="file" accept=".jpg,.jpeg,.png,.webp" class="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary-100" />
                             <p class="mt-1 text-[11px] text-muted">JPG, PNG, or WebP up to 5 MB. Stored privately.</p>
                           </div>
                           <p id="claim-error" class="text-xs text-danger hidden"></p>
                           <button type="submit" id="claim-submit-btn" class="btn-primary w-full">Submit Ownership Claim</button>
                         </form>`
                    : `<p class="mt-2 text-sm text-muted">This report is not currently eligible for ownership claims.</p>`
        }
                </div>`
        : ''
      }
        </div>
      </div>
    `;

    const deleteBtn = container.querySelector('#delete-item-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: 'Delete Item Report',
          message: 'Are you sure you want to permanently delete this report? This action cannot be undone.',
          confirmText: 'Delete Report',
          confirmStyle: 'danger',
        });
        if (!confirmed) return;
        try {
          await deleteItem(item.id);
          showToast('Report deleted successfully.', 'success');
          navigate('/dashboard/my-reports');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const claimForm = container.querySelector('#claim-form');
    if (claimForm) {
      claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = container.querySelector('#claim-error');
        const submitBtn = container.querySelector('#claim-submit-btn');
        errEl.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Claim...';

        try {
          const fd = new FormData(claimForm);
          fd.set('item_id', String(item.id));
          await createClaim(fd);
          showToast('Ownership claim submitted! An administrator will review it shortly.', 'success');
          await renderItemDetailsPage(root, { params });
        } catch (err) {
          errEl.textContent = extractFormErrorMessage(err);
          errEl.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Ownership Claim';
        }
      });
    }
  } catch (err) {
    container.innerHTML = renderErrorState(err.message || 'Item report could not be found.');
  }
}
