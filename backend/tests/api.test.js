const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/config/db');
const { sessionStore } = require('../src/config/session');
const { initDatabase } = require('../src/utils/initDb');

async function createClient() {
  const agent = request.agent(app);
  const csrfRes = await agent.get('/api/v1/auth/csrf-token');
  assert.equal(csrfRes.status, 200);
  let csrfToken = csrfRes.body.data.csrfToken;

  const updateToken = (res) => {
    if (res.body?.data?.csrfToken) {
      csrfToken = res.body.data.csrfToken;
    }
    return res;
  };

  return {
    agent,
    getCsrf: () => csrfToken,
    refreshCsrf: async () => {
      const r = await agent.get('/api/v1/auth/csrf-token');
      csrfToken = r.body.data.csrfToken;
      return csrfToken;
    },
    get: (url) => agent.get(url),
    post: (url, body) =>
      agent.post(url).set('x-csrf-token', csrfToken).send(body).then(updateToken),
    put: (url, body) =>
      agent.put(url).set('x-csrf-token', csrfToken).send(body).then(updateToken),
    patch: (url, body) =>
      agent.patch(url).set('x-csrf-token', csrfToken).send(body).then(updateToken),
    del: (url) =>
      agent.delete(url).set('x-csrf-token', csrfToken).then(updateToken),
  };
}

describe('Where Is It? Full-Stack API Integration Tests', () => {
  let studentClient;
  let otherStudentClient;
  let adminClient;
  let createdFoundItemId;
  let createdClaimId;
  let createdCategoryId;
  let registeredUserId;

  before(async () => {
    await initDatabase();
    studentClient = await createClient();
    otherStudentClient = await createClient();
    adminClient = await createClient();
  });

  after(async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const evDir = path.resolve(__dirname, '../private_uploads/evidence');
    for (const f of fs.readdirSync(evDir)) {
      if (f !== '.gitkeep') fs.unlinkSync(path.join(evDir, f));
    }
    await initDatabase();
    await sessionStore.close();
    await pool.end();
  });

  it('GET /api/v1/health returns healthy status', async () => {
    const res = await studentClient.get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
  });

  it('Authentication: rejects registration as ADMIN and prevents duplicate email', async () => {
    const adminAttempt = await studentClient.post('/api/v1/auth/register', {
      full_name: 'Fake Admin',
      email: 'fakeadmin@campus.edu',
      university_id: 'FAKE-999',
      department: 'CSE',
      role: 'ADMIN',
      password: 'Password123',
      confirm_password: 'Password123',
    });
    assert.equal(adminAttempt.status, 400);

    const regRes = await studentClient.post('/api/v1/auth/register', {
      full_name: 'Test Student One',
      email: 'test.student1@campus.edu',
      university_id: 'TEST-1001',
      department: 'Computer Science',
      role: 'STUDENT',
      password: 'Password123',
      confirm_password: 'Password123',
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);
    assert.equal(regRes.body.data.user.email, 'test.student1@campus.edu');
    assert.equal(regRes.body.data.user.password_hash, undefined);
    registeredUserId = regRes.body.data.user.id;

    // Duplicate email rejected
    const dupClient = await createClient();
    const dupRes = await dupClient.post('/api/v1/auth/register', {
      full_name: 'Duplicate User',
      email: 'test.student1@campus.edu',
      university_id: 'TEST-1002',
      department: 'CSE',
      role: 'STUDENT',
      password: 'Password123',
      confirm_password: 'Password123',
    });
    assert.equal(dupRes.status, 409);
  });

  it('Authentication: logout destroys session and invalid login returns 401', async () => {
    const meBefore = await studentClient.get('/api/v1/auth/me');
    assert.equal(meBefore.status, 200);

    const logoutRes = await studentClient.post('/api/v1/auth/logout', {});
    assert.equal(logoutRes.status, 200);

    const meAfter = await studentClient.get('/api/v1/auth/me');
    assert.equal(meAfter.status, 401);

    const badLogin = await studentClient.post('/api/v1/auth/login', {
      email: 'test.student1@campus.edu',
      password: 'WrongPassword1',
    });
    assert.equal(badLogin.status, 401);

    const goodLogin = await studentClient.post('/api/v1/auth/login', {
      email: 'test.student1@campus.edu',
      password: 'Password123',
    });
    assert.equal(goodLogin.status, 200);
    assert.equal(goodLogin.body.data.user.id, registeredUserId);
  });

  it('Authorization: blocks non-admin access to admin endpoints', async () => {
    const res = await studentClient.get('/api/v1/admin/dashboard');
    assert.equal(res.status, 403);
  });

  it('Items CRUD: creates, updates, enforces ownership, and supports search/filter/pagination', async () => {
    // Create a FOUND report as student 1
    const createRes = await studentClient.post('/api/v1/items', {
      item_name: 'Silver Logitech MX Mouse',
      category_id: 1,
      description: 'Found a silver wireless mouse near lecture hall podium.',
      report_type: 'FOUND',
      location: 'Lecture Hall 105',
      event_date: new Date().toISOString().slice(0, 10),
      approximate_time: '02:00 PM',
      contact_info: 'Campus Security Desk',
    });
    assert.equal(createRes.status, 201);
    createdFoundItemId = createRes.body.data.item.id;
    assert.equal(createRes.body.data.item.moderation_status, 'PENDING_REVIEW');

    // Public list should NOT expose PENDING_REVIEW item yet
    const publicBefore = await otherStudentClient.get('/api/v1/items?search=Logitech');
    assert.equal(publicBefore.status, 200);
    assert.equal(publicBefore.body.data.items.length, 0);

    // Owner updates own item
    const updateRes = await studentClient.put(`/api/v1/items/${createdFoundItemId}`, {
      item_name: 'Silver Logitech MX Master Mouse',
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.item.item_name, 'Silver Logitech MX Master Mouse');

    // Another student logs in and cannot edit/delete student 1's item
    await otherStudentClient.post('/api/v1/auth/login', {
      email: 'rafiq.ahmed@campus.edu',
      password: 'Student@1234',
    });
    const forbiddenEdit = await otherStudentClient.put(`/api/v1/items/${createdFoundItemId}`, {
      item_name: 'Hacked Item',
    });
    assert.equal(forbiddenEdit.status, 403);

    const forbiddenDelete = await otherStudentClient.del(`/api/v1/items/${createdFoundItemId}`);
    assert.equal(forbiddenDelete.status, 403);

    // Search & filter on seeded approved items
    const searchRes = await otherStudentClient.get('/api/v1/items?type=LOST&search=Sony&page=1&limit=5');
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.data.items.length >= 1);
    assert.ok(searchRes.body.meta.pagination.total >= 1);
  });

  it('Admin Moderation & Claim Return Workflow: approve report -> claim -> approve claim -> confirm return', async () => {
    const adminLogin = await adminClient.post('/api/v1/auth/login', {
      email: 'admin@campus.edu',
      password: 'Admin@1234',
    });
    assert.equal(adminLogin.status, 200);

    // Approve the newly created found item
    const approveItemRes = await adminClient.patch(
      `/api/v1/admin/items/${createdFoundItemId}/approve`,
      {}
    );
    assert.equal(approveItemRes.status, 200);
    assert.equal(approveItemRes.body.data.item.moderation_status, 'APPROVED');

    // Owner cannot claim their own found item
    const selfClaimRes = await studentClient.post('/api/v1/claims', {
      item_id: createdFoundItemId,
      explanation: 'Testing self claim prevention on my own found report.',
      identifying_details: 'Own report detail check.',
    });
    assert.equal(selfClaimRes.status, 400);

    // Other student submits valid ownership claim
    const claimRes = await otherStudentClient.post('/api/v1/claims', {
      item_id: createdFoundItemId,
      explanation: 'I left my MX Master mouse on the podium after the 1pm lecture.',
      identifying_details: 'Has a tiny scuff on the thumb rest and green sticker underneath.',
    });
    assert.equal(claimRes.status, 201);
    createdClaimId = claimRes.body.data.claim.id;
    assert.equal(claimRes.body.data.claim.status, 'PENDING');

    // Duplicate active claim prevented
    const dupClaimRes = await otherStudentClient.post('/api/v1/claims', {
      item_id: createdFoundItemId,
      explanation: 'Trying to submit a second claim for the exact same item.',
      identifying_details: 'Duplicate check.',
    });
    assert.equal(dupClaimRes.status, 409);

    // Unrelated user (finder) cannot inspect private claim proof
    const privateClaimForbidden = await studentClient.get(`/api/v1/claims/${createdClaimId}`);
    assert.equal(privateClaimForbidden.status, 403);

    // Admin approves claim -> item becomes CLAIMED
    const approveClaimRes = await adminClient.patch(
      `/api/v1/admin/claims/${createdClaimId}/approve`,
      { admin_notes: 'Verified details match.' }
    );
    assert.equal(approveClaimRes.status, 200);
    assert.equal(approveClaimRes.body.data.claim.status, 'APPROVED');

    const itemAfterClaim = await otherStudentClient.get(`/api/v1/items/${createdFoundItemId}`);
    assert.equal(itemAfterClaim.body.data.item.resolution_status, 'CLAIMED');

    // Admin confirms return -> claim COMPLETED, item RETURNED
    const completeRes = await adminClient.patch(
      `/api/v1/admin/claims/${createdClaimId}/complete`,
      { admin_notes: 'Handed over at Student Center Desk.' }
    );
    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.body.data.claim.status, 'COMPLETED');

    const itemAfterReturn = await otherStudentClient.get(`/api/v1/items/${createdFoundItemId}`);
    assert.equal(itemAfterReturn.body.data.item.resolution_status, 'RETURNED');
  });

  it('Notifications, Category Management, User Suspension & Activity Logs', async () => {
    // Claimant checks notifications & marks all read
    const notifRes = await otherStudentClient.get('/api/v1/notifications');
    assert.equal(notifRes.status, 200);
    assert.ok(notifRes.body.data.unreadCount >= 1);

    const readAllRes = await otherStudentClient.patch('/api/v1/notifications/read-all', {});
    assert.equal(readAllRes.status, 200);

    // Admin creates, updates, and deletes a category
    const catCreate = await adminClient.post('/api/v1/admin/categories', {
      name: 'Test Category Temp',
      description: 'Temporary test category',
    });
    assert.equal(catCreate.status, 201);
    createdCategoryId = catCreate.body.data.category.id;

    const catUpdate = await adminClient.put(`/api/v1/admin/categories/${createdCategoryId}`, {
      name: 'Test Category Renamed',
      description: 'Updated description',
    });
    assert.equal(catUpdate.status, 200);

    const catDel = await adminClient.del(`/api/v1/admin/categories/${createdCategoryId}`);
    assert.equal(catDel.status, 200);

    // Admin suspends and reactivates registered test user
    const suspendRes = await adminClient.patch(`/api/v1/admin/users/${registeredUserId}/status`, {
      account_status: 'SUSPENDED',
    });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data.user.account_status, 'SUSPENDED');

    // Suspended user blocked on protected route
    const suspendedMe = await studentClient.get('/api/v1/auth/me');
    assert.equal(suspendedMe.status, 403);

    const reactivateRes = await adminClient.patch(
      `/api/v1/admin/users/${registeredUserId}/status`,
      { account_status: 'ACTIVE' }
    );
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.body.data.user.account_status, 'ACTIVE');

    // Admin dashboard & activity logs check
    const dashRes = await adminClient.get('/api/v1/admin/dashboard');
    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.body.data.stats.total_users >= 5);

    const logsRes = await adminClient.get('/api/v1/admin/activity-logs');
    assert.equal(logsRes.status, 200);
    assert.ok(logsRes.body.data.logs.length >= 3);
  });

  it('Item deletion by owner on OPEN report works', async () => {
    await studentClient.refreshCsrf();
    await studentClient.post('/api/v1/auth/login', {
      email: 'test.student1@campus.edu',
      password: 'Password123',
    });

    const tempItem = await studentClient.post('/api/v1/items', {
      item_name: 'Temporary Lost Umbrella',
      category_id: 6,
      description: 'Black compact umbrella left outside Science Annex.',
      report_type: 'LOST',
      location: 'Science Annex',
      event_date: new Date().toISOString().slice(0, 10),
    });
    assert.equal(tempItem.status, 201);
    const tempId = tempItem.body.data.item.id;

    const delRes = await studentClient.del(`/api/v1/items/${tempId}`);
    assert.equal(delRes.status, 200);

    const rows = await query('SELECT id FROM items WHERE id = ?', [tempId]);
    assert.equal(rows.length, 0);
  });

  it('Upload security: rejects executable files and protects private claim evidence', async () => {
    const badUpload = await studentClient.agent
      .post('/api/v1/items')
      .set('x-csrf-token', studentClient.getCsrf())
      .field('item_name', 'Suspicious Upload')
      .field('category_id', '1')
      .field('description', 'Testing malicious file rejection on upload endpoint.')
      .field('report_type', 'LOST')
      .field('location', 'Library')
      .field('event_date', new Date().toISOString().slice(0, 10))
      .attach('image', Buffer.from('malicious script'), {
        filename: 'payload.exe',
        contentType: 'application/x-msdownload',
      });
    assert.equal(badUpload.status, 400);

    // Valid 1x1 PNG buffer for private claim evidence on seeded found item #6
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );
    const claimWithFile = await studentClient.agent
      .post('/api/v1/claims')
      .set('x-csrf-token', studentClient.getCsrf())
      .field('item_id', '6')
      .field('explanation', 'I dropped my dorm keyring outside the cafeteria seating area.')
      .field('identifying_details', 'Blue tag number 42 with small brass locker key.')
      .attach('evidence', png1x1, {
        filename: 'proof.png',
        contentType: 'image/png',
      });
    assert.equal(claimWithFile.status, 201);
    const evClaimId = claimWithFile.body.data.claim.id;

    // Claimant can access their private evidence
    const ownerEv = await studentClient.get(`/api/v1/claims/${evClaimId}/evidence`);
    assert.equal(ownerEv.status, 200);

    // Admin can access private evidence
    const adminEv = await adminClient.get(`/api/v1/claims/${evClaimId}/evidence`);
    assert.equal(adminEv.status, 200);

    // Unrelated user cannot access private evidence
    const otherEv = await otherStudentClient.get(`/api/v1/claims/${evClaimId}/evidence`);
    assert.equal(otherEv.status, 403);
  });
});
