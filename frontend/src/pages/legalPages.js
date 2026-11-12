import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';

export async function renderPrivacyPage(root) {
  root.innerHTML = renderPublicShell(`
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="card p-7 sm:p-10 space-y-6">
        <div>
          <span class="badge bg-slate-100 text-slate-700">Policy Document</span>
          <h1 class="mt-2 text-3xl font-extrabold text-dark">Privacy Policy</h1>
          <p class="mt-2 text-sm text-muted">How Where Is It? handles campus user records and private claim evidence.</p>
        </div>
        <div class="space-y-4 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 class="text-base font-bold text-dark">1. Information Collected</h2>
            <p class="mt-1">We collect your full name, university email, university ID, department, and role strictly to verify campus membership and coordinate safe return of lost and found property.</p>
          </section>
          <section>
            <h2 class="text-base font-bold text-dark">2. Protection of Private Claim Evidence</h2>
            <p class="mt-1">Ownership explanations, identifying details, and supporting evidence images uploaded during claims are stored outside public web directories and are accessible only to the claimant and authorized campus administrators.</p>
          </section>
          <section>
            <h2 class="text-base font-bold text-dark">3. Session &amp; Data Security</h2>
            <p class="mt-1">Passwords are hashed with bcrypt and never stored or transmitted in plaintext. Authentication uses HTTP-only server sessions backed by MySQL.</p>
          </section>
        </div>
      </div>
    </div>
  `);
  bindShellEvents(root);
}

export async function renderTermsPage(root) {
  root.innerHTML = renderPublicShell(`
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="card p-7 sm:p-10 space-y-6">
        <div>
          <span class="badge bg-slate-100 text-slate-700">Campus Guidelines</span>
          <h1 class="mt-2 text-3xl font-extrabold text-dark">Terms &amp; Conditions</h1>
          <p class="mt-2 text-sm text-muted">Acceptable use rules for the Where Is It? Campus Lost &amp; Found Portal.</p>
        </div>
        <div class="space-y-4 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 class="text-base font-bold text-dark">1. Accurate Reporting</h2>
            <p class="mt-1">Users agree to submit truthful, accurate descriptions of lost and found items. False reports or fraudulent ownership claims may result in account suspension and disciplinary referral.</p>
          </section>
          <section>
            <h2 class="text-base font-bold text-dark">2. Moderation &amp; Verification</h2>
            <p class="mt-1">All submitted reports undergo administrator moderation before appearing publicly. Ownership claims require verifiable details prior to item release.</p>
          </section>
          <section>
            <h2 class="text-base font-bold text-dark">3. Handover &amp; Liability</h2>
            <p class="mt-1">Physical exchanges should take place at the designated Campus Lost &amp; Found Desk during posted office hours with valid University ID verification.</p>
          </section>
        </div>
      </div>
    </div>
  `);
  bindShellEvents(root);
}

export async function renderNotFoundPage(root) {
  root.innerHTML = renderPublicShell(`
    <div class="max-w-xl mx-auto px-4 py-20 text-center">
      <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary font-display text-2xl font-extrabold">404</div>
      <h1 class="mt-5 text-3xl font-extrabold text-dark">Page Not Found</h1>
      <p class="mt-2 text-sm text-muted">Looks like this page is missing too! Let's get you back to the campus Lost &amp; Found portal.</p>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a href="/" data-link class="btn-primary">Return Home</a>
        <a href="/lost-items" data-link class="btn-secondary">Browse Lost Items</a>
        <a href="/found-items" data-link class="btn-secondary">Browse Found Items</a>
      </div>
    </div>
  `);
  bindShellEvents(root);
}

