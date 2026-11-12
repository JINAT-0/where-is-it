import { renderPublicShell, bindShellEvents } from '../components/dashboardShell.js';
import { login, register } from '../js/auth.js';
import { navigate } from '../js/router.js';
import { extractFormErrorMessage, showToast } from '../js/utils.js';

export async function renderLoginPage(root, { query = {} } = {}) {
  const redirectTarget = query.redirect || '';

  root.innerHTML = renderPublicShell(`
    <div class="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div class="card p-7 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-extrabold text-dark">Welcome Back</h1>
          <p class="mt-1.5 text-sm text-muted">Sign in to your campus Lost &amp; Found account</p>
        </div>

        <form id="login-form" class="space-y-4">
          <div>
            <label for="login-email" class="form-label">University Email</label>
            <input id="login-email" name="email" type="email" required autocomplete="email" placeholder="name@campus.edu" class="input-field" />
          </div>
          <div>
            <label for="login-password" class="form-label">Password</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" placeholder="Enter your password" class="input-field" />
          </div>

          <div id="login-error" class="hidden rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-danger"></div>

          <button type="submit" id="login-submit" class="btn-primary w-full py-2.5">Sign In</button>
        </form>

        <!-- Demo Credentials Helper for Campus Demonstration -->
        <div class="mt-6 pt-5 border-t border-slate-100">
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Demo Quick Fill (Viva / Testing)</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" data-demo-email="sadia.rahman@campus.edu" data-demo-pass="Student@1234" class="btn-secondary py-1.5 px-2.5 text-xs">Student Demo</button>
            <button type="button" data-demo-email="dr.karim@campus.edu" data-demo-pass="Faculty@1234" class="btn-secondary py-1.5 px-2.5 text-xs">Faculty Demo</button>
            <button type="button" data-demo-email="tariq.mahmood@campus.edu" data-demo-pass="Staff@1234" class="btn-secondary py-1.5 px-2.5 text-xs">Staff Demo</button>
            <button type="button" data-demo-email="admin@campus.edu" data-demo-pass="Admin@1234" class="btn-secondary py-1.5 px-2.5 text-xs">Admin Demo</button>
          </div>
        </div>

        <p class="mt-6 text-center text-sm text-muted">
          New to Where Is It?
          <a href="/register" data-link class="font-semibold text-primary hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  `);

  bindShellEvents(root);

  const form = root.querySelector('#login-form');
  const errBox = root.querySelector('#login-error');
  const submitBtn = root.querySelector('#login-submit');

  root.querySelectorAll('[data-demo-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      form.email.value = btn.dataset.demoEmail;
      form.password.value = btn.dataset.demoPass;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const user = await login({
        email: form.email.value.trim(),
        password: form.password.value,
      });
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      if (redirectTarget && redirectTarget.startsWith('/')) {
        navigate(redirectTarget);
      } else {
        navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      errBox.textContent = extractFormErrorMessage(err);
      errBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

export async function renderRegisterPage(root) {
  root.innerHTML = renderPublicShell(`
    <div class="max-w-lg mx-auto px-4 py-12">
      <div class="card p-7 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-extrabold text-dark">Create Campus Account</h1>
          <p class="mt-1.5 text-sm text-muted">Register as a Student, Faculty member, or University Staff</p>
        </div>

        <form id="register-form" class="space-y-4">
          <div>
            <label for="reg-name" class="form-label">Full Name *</label>
            <input id="reg-name" name="full_name" type="text" required minlength="2" placeholder="e.g. Anika Tabassum" class="input-field" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="reg-email" class="form-label">University Email *</label>
              <input id="reg-email" name="email" type="email" required placeholder="anika@campus.edu" class="input-field" />
            </div>
            <div>
              <label for="reg-uid" class="form-label">University ID *</label>
              <input id="reg-uid" name="university_id" type="text" required minlength="3" placeholder="e.g. 221-15-1099" class="input-field" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="reg-dept" class="form-label">Department *</label>
              <input id="reg-dept" name="department" type="text" required placeholder="e.g. Computer Science" class="input-field" />
            </div>
            <div>
              <label for="reg-role" class="form-label">Campus Role *</label>
              <select id="reg-role" name="role" required class="input-field">
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
                <option value="STAFF">University Staff</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="reg-pass" class="form-label">Password *</label>
              <input id="reg-pass" name="password" type="password" required minlength="8" placeholder="Min 8 chars, letters &amp; digits" class="input-field" />
            </div>
            <div>
              <label for="reg-cpass" class="form-label">Confirm Password *</label>
              <input id="reg-cpass" name="confirm_password" type="password" required minlength="8" placeholder="Re-enter password" class="input-field" />
            </div>
          </div>

          <div id="register-error" class="hidden rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-danger"></div>

          <button type="submit" id="register-submit" class="btn-primary w-full py-2.5">Create Account</button>
        </form>

        <p class="mt-6 text-center text-sm text-muted">
          Already have an account?
          <a href="/login" data-link class="font-semibold text-primary hover:underline">Log in here</a>
        </p>
      </div>
    </div>
  `);

  bindShellEvents(root);

  const form = root.querySelector('#register-form');
  const errBox = root.querySelector('#register-error');
  const submitBtn = root.querySelector('#register-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');

    if (form.password.value !== form.confirm_password.value) {
      errBox.textContent = 'Passwords do not match.';
      errBox.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const user = await register({
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        university_id: form.university_id.value.trim(),
        department: form.department.value.trim(),
        role: form.role.value,
        password: form.password.value,
        confirm_password: form.confirm_password.value,
      });
      showToast(`Welcome to Where Is It?, ${user.full_name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      errBox.textContent = extractFormErrorMessage(err);
      errBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

