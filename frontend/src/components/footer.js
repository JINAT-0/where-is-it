export function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="mt-auto border-t border-slate-200 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="md:col-span-2">
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span class="font-display font-bold text-dark text-base">Where Is It?</span>
            </div>
            <p class="mt-3 text-sm text-muted max-w-md leading-relaxed">
              The official campus Lost &amp; Found portal helping students, faculty, and staff report missing items, verify ownership claims securely, and coordinate safe returns.
            </p>
          </div>
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-dark">Explore</h4>
            <ul class="mt-3 space-y-2 text-sm text-muted">
              <li><a href="/lost-items" data-link class="hover:text-primary transition">Browse Lost Items</a></li>
              <li><a href="/found-items" data-link class="hover:text-primary transition">Browse Found Items</a></li>
              <li><a href="/dashboard/report-lost" data-link class="hover:text-primary transition">Report Lost Item</a></li>
              <li><a href="/dashboard/report-found" data-link class="hover:text-primary transition">Report Found Item</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-dark">Information</h4>
            <ul class="mt-3 space-y-2 text-sm text-muted">
              <li><a href="/about" data-link class="hover:text-primary transition">About Portal</a></li>
              <li><a href="/privacy-policy" data-link class="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="/terms" data-link class="hover:text-primary transition">Terms &amp; Conditions</a></li>
              <li><a href="/login" data-link class="hover:text-primary transition">Campus Login</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>&copy; ${year} Where Is It? — University Campus Lost &amp; Found Management System.</p>
          <p>Verified Campus Recovery Workflow</p>
        </div>
      </div>
    </footer>
  `;
}

