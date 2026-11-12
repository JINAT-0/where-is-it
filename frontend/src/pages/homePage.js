import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';
import { renderItemCard } from '../components/itemCard.js';
import { getItems } from '../js/items.js';
import { navigate } from '../js/router.js';
import { store } from '../js/state.js';
import { renderLoading, renderErrorState } from '../js/utils.js';

export async function renderHomePage(root) {
  root.innerHTML = renderPublicShell(`
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-dark text-white">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-blue-900/30 pointer-events-none"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
        <div class="max-w-3xl">
          <span class="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs font-semibold text-blue-200">
            Official University Lost &amp; Found Portal
          </span>
          <h1 class="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Lost something on campus? <span class="text-blue-400">Let's help you find it.</span>
          </h1>
          <p class="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Where Is It? connects students, faculty, and staff through a verified moderation and ownership claim workflow so recovered belongings return safely to their rightful owners.
          </p>

          <!-- Quick Search Bar -->
          <form id="home-search-form" class="mt-8 bg-white rounded-xl p-2 shadow-xl flex flex-col sm:flex-row gap-2 max-w-2xl">
            <input
              type="text"
              name="search"
              placeholder="Search laptops, ID cards, keys, Central Library..."
              class="flex-1 rounded-lg px-4 py-2.5 text-sm text-dark placeholder-slate-400 focus:outline-none"
            />
            <select name="type" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-dark focus:outline-none">
              <option value="LOST">Lost Items</option>
              <option value="FOUND">Found Items</option>
            </select>
            <button type="submit" class="btn-primary px-6 py-2.5">Search</button>
          </form>

          <div class="mt-7 flex flex-wrap items-center gap-3">
            <a href="${store.user ? '/dashboard/report-lost' : '/register'}" data-link class="btn-primary px-5 py-2.5">
              Report a Lost Item
            </a>
            <a href="${store.user ? '/dashboard/report-found' : '/found-items'}" data-link class="btn bg-white/10 text-white hover:bg-white/20 border border-white/15 px-5 py-2.5">
              ${store.user ? 'Report a Found Item' : 'Browse Found Items'}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div class="text-center max-w-2xl mx-auto mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-dark">Verified Campus Recovery Workflow</h2>
        <p class="mt-2 text-sm text-muted">Every report and ownership claim is reviewed by campus administrators to protect privacy and prevent false claims.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-6">
          <div class="h-10 w-10 rounded-xl bg-primary-50 text-primary font-bold flex items-center justify-center mb-4">1</div>
          <h3 class="text-base font-bold text-dark">Submit a Report</h3>
          <p class="mt-2 text-sm text-muted leading-relaxed">Report lost or found belongings with clear descriptions, campus location, date, and optional photos.</p>
        </div>
        <div class="card p-6">
          <div class="h-10 w-10 rounded-xl bg-amber-50 text-warning font-bold flex items-center justify-center mb-4">2</div>
          <h3 class="text-base font-bold text-dark">Admin Moderation &amp; Claim</h3>
          <p class="mt-2 text-sm text-muted leading-relaxed">Administrators approve valid reports. Owners submit private identifying proof to claim matching found items.</p>
        </div>
        <div class="card p-6">
          <div class="h-10 w-10 rounded-xl bg-emerald-50 text-success font-bold flex items-center justify-center mb-4">3</div>
          <h3 class="text-base font-bold text-dark">Safe Return Confirmation</h3>
          <p class="mt-2 text-sm text-muted leading-relaxed">Once verified, claimants coordinate pickup at the Campus Lost &amp; Found Desk and items are marked Returned.</p>
        </div>
      </div>
    </section>

    <!-- Recent Items from Database -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
      <div>
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-dark">Recently Reported Lost Items</h2>
            <p class="text-sm text-muted">Help fellow campus members locate missing belongings.</p>
          </div>
          <a href="/lost-items" data-link class="text-sm font-semibold text-primary hover:text-primary-700">View all lost &rarr;</a>
        </div>
        <div id="home-lost-grid">${renderLoading('Loading recent lost items...')}</div>
      </div>

      <div>
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-dark">Recently Found Items</h2>
            <p class="text-sm text-muted">Check if one of these recovered items belongs to you.</p>
          </div>
          <a href="/found-items" data-link class="text-sm font-semibold text-primary hover:text-primary-700">View all found &rarr;</a>
        </div>
        <div id="home-found-grid">${renderLoading('Loading recent found items...')}</div>
      </div>
    </section>
  `);

  bindShellEvents(root);

  const searchForm = root.querySelector('#home-search-form');
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(searchForm);
    const term = String(data.get('search') || '').trim();
    const type = String(data.get('type') || 'LOST');
    const target = type === 'FOUND' ? '/found-items' : '/lost-items';
    navigate(term ? `${target}?search=${encodeURIComponent(term)}` : target);
  });

  try {
    const [lostRes, foundRes] = await Promise.all([
      getItems({ type: 'LOST', limit: 3, sort: 'newest' }),
      getItems({ type: 'FOUND', limit: 3, sort: 'newest' }),
    ]);

    const lostGrid = root.querySelector('#home-lost-grid');
    lostGrid.innerHTML =
      lostRes.items.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${lostRes.items.map(renderItemCard).join('')}</div>`
        : `<div class="card p-8 text-center text-sm text-muted">No approved lost item reports yet.</div>`;

    const foundGrid = root.querySelector('#home-found-grid');
    foundGrid.innerHTML =
      foundRes.items.length > 0
        ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${foundRes.items.map(renderItemCard).join('')}</div>`
        : `<div class="card p-8 text-center text-sm text-muted">No approved found item reports yet.</div>`;
  } catch (err) {
    root.querySelector('#home-lost-grid').innerHTML = renderErrorState(err.message);
    root.querySelector('#home-found-grid').innerHTML = renderErrorState(err.message);
  }
}

