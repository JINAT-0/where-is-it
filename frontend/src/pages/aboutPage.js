import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';

export async function renderAboutPage(root) {
  root.innerHTML = renderPublicShell(`
    <section class="bg-white border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <span class="badge bg-primary-50 text-primary border border-primary-100">About Where Is It?</span>
        <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold text-dark tracking-tight">
          A Centralized, Trust-First Campus Lost &amp; Found System
        </h1>
        <p class="mt-4 text-base text-muted leading-relaxed">
          Universities generate hundreds of misplaced items each semester—ranging from student IDs and calculators to laptops and lab gear. Where Is It? replaces fragmented noticeboards and social media posts with a secure, auditable campus portal.
        </p>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h2 class="text-lg font-bold text-dark">Privacy &amp; Verification</h2>
          <p class="mt-2 text-sm text-muted leading-relaxed">
            Public listings omit sensitive personal identifiers. When claiming a found item, claimants submit private identifying details and optional evidence that are visible only to the claimant and authorized campus administrators.
          </p>
        </div>
        <div class="card p-6">
          <h2 class="text-lg font-bold text-dark">Role-Based Governance</h2>
          <p class="mt-2 text-sm text-muted leading-relaxed">
            Students, faculty, and university staff share streamlined reporting and claiming tools, while campus administrators moderate submissions, review ownership proofs, and record every recovery in an audit log.
          </p>
        </div>
      </div>

      <div class="card p-6 sm:p-8">
        <h2 class="text-xl font-bold text-dark">Campus Lost &amp; Found Desk Guidelines</h2>
        <ul class="mt-4 space-y-2.5 text-sm text-slate-600 list-disc pl-5">
          <li>Bring your valid University ID card when picking up an approved claim at the Student Center Lost &amp; Found Desk.</li>
          <li>High-value items such as laptops, smartphones, and wallets should be handed directly to Campus Security or Library Staff after submitting a found report.</li>
          <li>Do not publish sensitive serial numbers, passwords, or national ID numbers in public item descriptions—keep them for private claim verification.</li>
        </ul>
      </div>
    </section>
  `);
  bindShellEvents(root);
}

