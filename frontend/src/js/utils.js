export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(dateStr);
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(dateStr);
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str, max = 110) {
  if (!str) return '';
  if (str.length <= max) return str;
  return `${str.slice(0, max).trim()}...`;
}

export function renderBadge(value, kind = 'default') {
  const styles = {
    LOST: 'bg-red-50 text-danger border border-red-200',
    FOUND: 'bg-blue-50 text-primary border border-blue-200',
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-50 text-success border border-emerald-200',
    REJECTED: 'bg-red-50 text-danger border border-red-200',
    OPEN: 'bg-sky-50 text-sky-700 border border-sky-200',
    MATCHED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    CLAIMED: 'bg-amber-50 text-amber-700 border border-amber-200',
    RETURNED: 'bg-emerald-50 text-success border border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-600 border border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    WITHDRAWN: 'bg-slate-100 text-slate-600 border border-slate-200',
    COMPLETED: 'bg-emerald-50 text-success border border-emerald-200',
    ACTIVE: 'bg-emerald-50 text-success border border-emerald-200',
    SUSPENDED: 'bg-red-50 text-danger border border-red-200',
    ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200',
    FACULTY: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    STAFF: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    STUDENT: 'bg-slate-100 text-slate-700 border border-slate-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  const label = String(value || kind).replace(/_/g, ' ');
  const cls = styles[value] || styles[kind] || styles.default;
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const colors = {
    success: 'bg-white border-l-4 border-l-success border border-slate-200 text-dark',
    error: 'bg-white border-l-4 border-l-danger border border-slate-200 text-dark',
    warning: 'bg-white border-l-4 border-l-warning border border-slate-200 text-dark',
    info: 'bg-white border-l-4 border-l-primary border border-slate-200 text-dark',
  };

  const icons = {
    success: '<svg class="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error: '<svg class="w-5 h-5 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg class="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>',
    info: '<svg class="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `toast-enter pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-lg ${colors[type] || colors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <p class="text-sm font-medium flex-1 leading-snug">${escapeHtml(message)}</p>
    <button type="button" aria-label="Close" class="text-slate-400 hover:text-dark text-lg leading-none">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}

export function confirmDialog({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmStyle = 'primary',
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
    const btnClass =
      confirmStyle === 'danger'
        ? 'btn-danger'
        : confirmStyle === 'success'
        ? 'btn-success'
        : 'btn-primary';

    overlay.innerHTML = `
      <div class="card max-w-md w-full p-6 shadow-xl" role="dialog" aria-modal="true">
        <h3 class="text-lg font-bold text-dark">${escapeHtml(title)}</h3>
        <p class="mt-2 text-sm text-muted leading-relaxed">${escapeHtml(message)}</p>
        <div class="mt-6 flex items-center justify-end gap-3">
          <button type="button" data-action="cancel" class="btn-secondary">Cancel</button>
          <button type="button" data-action="confirm" class="${btnClass}">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });

    document.body.appendChild(overlay);
  });
}

export function promptDialog({
  title = 'Provide Details',
  message = '',
  label = 'Notes / Reason',
  placeholder = 'Enter details...',
  required = true,
  confirmText = 'Submit',
  confirmStyle = 'primary',
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
    const btnClass =
      confirmStyle === 'danger'
        ? 'btn-danger'
        : confirmStyle === 'success'
        ? 'btn-success'
        : 'btn-primary';

    overlay.innerHTML = `
      <form class="card max-w-md w-full p-6 shadow-xl" role="dialog" aria-modal="true">
        <h3 class="text-lg font-bold text-dark">${escapeHtml(title)}</h3>
        ${message ? `<p class="mt-1.5 text-sm text-muted">${escapeHtml(message)}</p>` : ''}
        <div class="mt-4">
          <label class="form-label">${escapeHtml(label)}</label>
          <textarea rows="3" class="input-field" placeholder="${escapeHtml(placeholder)}" ${required ? 'required minlength="5"' : ''}></textarea>
          <p class="mt-1 text-xs text-danger hidden" data-error></p>
        </div>
        <div class="mt-5 flex items-center justify-end gap-3">
          <button type="button" data-action="cancel" class="btn-secondary">Cancel</button>
          <button type="submit" class="${btnClass}">${escapeHtml(confirmText)}</button>
        </div>
      </form>
    `;

    const form = overlay.querySelector('form');
    const textarea = overlay.querySelector('textarea');
    const errorEl = overlay.querySelector('[data-error]');

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = textarea.value.trim();
      if (required && val.length < 5) {
        errorEl.textContent = 'Please provide at least 5 characters.';
        errorEl.classList.remove('hidden');
        return;
      }
      cleanup(val);
    });

    document.body.appendChild(overlay);
    textarea.focus();
  });
}

export function renderLoading(message = 'Loading...') {
  return `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="h-9 w-9 animate-spin rounded-full border-4 border-primary-100 border-t-primary"></div>
      <p class="mt-3 text-sm font-medium text-muted">${escapeHtml(message)}</p>
    </div>
  `;
}

export function renderEmptyState({ title, description, actionHtml = '' }) {
  return `
    <div class="card p-10 text-center flex flex-col items-center justify-center">
      <div class="h-12 w-12 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-3">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="text-base font-semibold text-dark">${escapeHtml(title)}</h3>
      <p class="mt-1 text-sm text-muted max-w-md">${escapeHtml(description)}</p>
      ${actionHtml ? `<div class="mt-5">${actionHtml}</div>` : ''}
    </div>
  `;
}

export function renderErrorState(message = 'Something went wrong while loading data.') {
  return `
    <div class="card border-red-200 bg-red-50/50 p-6 text-center">
      <p class="text-sm font-semibold text-danger">${escapeHtml(message)}</p>
    </div>
  `;
}

export function renderPagination(pagination, onPageChange) {
  if (!pagination || pagination.totalPages <= 1) return '';
  const { page, totalPages, total } = pagination;
  const pages = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return `
    <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
      <p class="text-sm text-muted">
        Showing page <span class="font-semibold text-dark">${page}</span> of <span class="font-semibold text-dark">${totalPages}</span> (${total} total)
      </p>
      <div class="flex items-center gap-1.5" data-pagination>
        <button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} class="btn-secondary px-3 py-1.5 text-xs">Previous</button>
        ${pages
          .map((p) =>
            p === '...'
              ? `<span class="px-2 text-muted text-xs">...</span>`
              : `<button type="button" data-page="${p}" class="btn px-3 py-1.5 text-xs ${
                  p === page ? 'bg-primary text-white' : 'bg-white text-dark border border-slate-200 hover:bg-slate-50'
                }">${p}</button>`
          )
          .join('')}
        <button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} class="btn-secondary px-3 py-1.5 text-xs">Next</button>
      </div>
    </div>
  `;
}

export function bindPagination(container, onPageChange) {
  const wrap = container.querySelector('[data-pagination]');
  if (!wrap) return;
  wrap.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPage = parseInt(btn.dataset.page, 10);
      if (!btn.disabled && targetPage >= 1) {
        onPageChange(targetPage);
      }
    });
  });
}

export function extractFormErrorMessage(err) {
  if (err?.errors && err.errors.length > 0) {
    return err.errors.map((e) => e.message).join(' • ');
  }
  return err?.message || 'An unexpected error occurred.';
}

