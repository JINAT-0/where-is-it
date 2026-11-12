import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';
import { renderItemCard } from '../components/itemCard.js';
import { getCategories, getItems } from '../js/items.js';
import {
  bindPagination,
  escapeHtml,
  renderEmptyState,
  renderErrorState,
  renderLoading,
  renderPagination,
} from '../js/utils.js';

export function createBrowseItemsHandler(reportType) {
  const isLost = reportType === 'LOST';

  return async function renderBrowseItemsPage(root, { query = {} } = {}) {
    const state = {
      search: query.search || '',
      category: query.category || '',
      location: query.location || '',
      date: query.date || '',
      status: query.status || '',
      sort: query.sort || 'newest',
      page: parseInt(query.page, 10) || 1,
    };

    root.innerHTML = renderPublicShell(`
      <section class="bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span class="badge ${isLost ? 'bg-red-50 text-danger border border-red-200' : 'bg-blue-50 text-primary border border-blue-200'}">
              ${isLost ? 'Lost Item Reports' : 'Found Item Reports'}
            </span>
            <h1 class="mt-2 text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
              ${isLost ? 'Browse Lost Items on Campus' : 'Browse Found Items on Campus'}
            </h1>
            <p class="mt-1 text-sm text-muted">
              ${
                isLost
                  ? 'Search approved reports submitted by campus members looking for misplaced belongings.'
                  : 'Inspect approved found items recovered across campus and submit an ownership claim if yours is listed.'
              }
            </p>
          </div>
          <a href="${isLost ? '/dashboard/report-lost' : '/dashboard/report-found'}" data-link class="btn-primary shrink-0">
            + Report ${isLost ? 'Lost' : 'Found'} Item
          </a>
        </div>
      </section>

      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filters -->
        <form id="browse-filter-form" class="card p-5 mb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div class="lg:col-span-2">
              <label for="filter-search" class="form-label">Keyword</label>
              <input id="filter-search" name="search" type="text" value="${escapeHtml(state.search)}" placeholder="Item name, description..." class="input-field" />
            </div>
            <div>
              <label for="filter-category" class="form-label">Category</label>
              <select id="filter-category" name="category" class="input-field">
                <option value="">All Categories</option>
              </select>
            </div>
            <div>
              <label for="filter-location" class="form-label">Location</label>
              <input id="filter-location" name="location" type="text" value="${escapeHtml(state.location)}" placeholder="e.g. Library" class="input-field" />
            </div>
            <div>
              <label for="filter-date" class="form-label">Date</label>
              <input id="filter-date" name="date" type="date" value="${escapeHtml(state.date)}" class="input-field" />
            </div>
            <div>
              <label for="filter-sort" class="form-label">Sort Order</label>
              <select id="filter-sort" name="sort" class="input-field">
                <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest First</option>
                <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
              </select>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <label for="filter-status" class="text-xs font-semibold text-muted">Status:</label>
              <select id="filter-status" name="status" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-dark">
                <option value="">All Statuses</option>
                <option value="OPEN" ${state.status === 'OPEN' ? 'selected' : ''}>Open</option>
                <option value="CLAIMED" ${state.status === 'CLAIMED' ? 'selected' : ''}>Claimed</option>
                <option value="RETURNED" ${state.status === 'RETURNED' ? 'selected' : ''}>Returned</option>
              </select>
            </div>
            <div class="flex items-center gap-2.5">
              <button type="button" id="clear-filters-btn" class="btn-secondary py-2 px-3.5 text-xs">Clear Filters</button>
              <button type="submit" class="btn-primary py-2 px-4 text-xs">Apply Filters</button>
            </div>
          </div>
        </form>

        <div id="browse-results">${renderLoading('Searching database records...')}</div>
      </section>
    `);

    bindShellEvents(root);

    const form = root.querySelector('#browse-filter-form');
    const categorySelect = root.querySelector('#filter-category');
    const resultsContainer = root.querySelector('#browse-results');

    async function loadCategoriesIntoSelect() {
      try {
        const categories = await getCategories();
        categories.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = String(c.id);
          opt.textContent = c.name;
          if (String(c.id) === String(state.category)) opt.selected = true;
          categorySelect.appendChild(opt);
        });
      } catch {
        // category filter remains optional if fetch fails
      }
    }

    async function fetchAndRender() {
      resultsContainer.innerHTML = renderLoading('Fetching matching items...');
      try {
        const { items, pagination } = await getItems({
          type: reportType,
          search: state.search,
          category: state.category,
          location: state.location,
          date: state.date,
          status: state.status,
          sort: state.sort,
          page: state.page,
          limit: 9,
        });

        if (items.length === 0) {
          resultsContainer.innerHTML = renderEmptyState({
            title: `No ${isLost ? 'lost' : 'found'} items matched your filters`,
            description: 'Try clearing some search filters or check back later as new reports are approved.',
            actionHtml: `<button type="button" id="empty-clear-btn" class="btn-secondary">Reset Filters</button>`,
          });
          resultsContainer.querySelector('#empty-clear-btn')?.addEventListener('click', resetFilters);
          return;
        }

        resultsContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${items.map(renderItemCard).join('')}
          </div>
          ${renderPagination(pagination)}
        `;

        bindPagination(resultsContainer, (nextPage) => {
          state.page = nextPage;
          fetchAndRender();
        });
      } catch (err) {
        resultsContainer.innerHTML = renderErrorState(err.message);
      }
    }

    function resetFilters() {
      state.search = '';
      state.category = '';
      state.location = '';
      state.date = '';
      state.status = '';
      state.sort = 'newest';
      state.page = 1;
      form.reset();
      fetchAndRender();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      state.search = String(fd.get('search') || '');
      state.category = String(fd.get('category') || '');
      state.location = String(fd.get('location') || '');
      state.date = String(fd.get('date') || '');
      state.status = String(fd.get('status') || '');
      state.sort = String(fd.get('sort') || 'newest');
      state.page = 1;
      fetchAndRender();
    });

    root.querySelector('#clear-filters-btn').addEventListener('click', resetFilters);

    await loadCategoriesIntoSelect();
    await fetchAndRender();
  };
}

