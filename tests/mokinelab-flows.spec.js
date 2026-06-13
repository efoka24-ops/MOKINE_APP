// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const SS = path.join(__dirname, 'screenshots', 'lab');
fs.mkdirSync(SS, { recursive: true });

const shot = (page, name) =>
  page.screenshot({ path: path.join(SS, `${name}.png`), fullPage: true });

// ── Tokens pré-générés (bypass rate limiter) ─────────────────────────────────
const TOKENS = {
  admin: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImxhYl9hZG1pbjEiLCJlbWFpbCI6ImFkbWluQG1va2luZWxhYi5jbSIsInJvbGUiOiJsYWJfYWRtaW4iLCJhcHAiOiJsYWIiLCJpYXQiOjE3ODEzNDA0NzQsImV4cCI6MTc4MzkzMjQ3NH0.HjvVnlYm_TZzE1y1khCr71uAr_Zgp9_3uLphT3bvjQ0',
    user: { id:'lab_admin1', email:'admin@mokinelab.cm', name:'Admin MokineLab', role:'lab_admin', app:'lab' },
  },
  researcher: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImxhYl8xNzgxMzM5NzkwMzQ1IiwiZW1haWwiOiJyZXNlYXJjaGVyQHRlc3QuY20iLCJyb2xlIjoicmVzZWFyY2hlciIsImFwcCI6ImxhYiIsImlhdCI6MTc4MTM0MDQ3NCwiZXhwIjoxNzgzOTMyNDc0fQ.kVEUF74tyEKfloLQcgLj8mCdBaNZp3xrTmxnF3si27c',
    user: { id:'lab_1781339790345', email:'researcher@test.cm', name:'Marie Chercheur', role:'researcher', app:'lab', institution:'IRAD Garoua', datasetAccess:'none' },
  },
  developer: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImxhYl8xNzgxMzM5NzkwNjMwIiwiZW1haWwiOiJkZXZAdGVzdC5jbSIsInJvbGUiOiJkZXZlbG9wZXIiLCJhcHAiOiJsYWIiLCJpYXQiOjE3ODEzNDA0NzUsImV4cCI6MTc4MzkzMjQ3NX0.ddebWtAhXma_XfFQwhfpxDZ2XYqjxuIYxCiebPf5wH0',
    user: { id:'lab_1781339790630', email:'dev@test.cm', name:'Paul Dev', role:'developer', app:'lab', company:'TechVet SARL', datasetAccess:'none' },
  },
  vet: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImxhYl8xNzgxMzM5NzkwODg2IiwiZW1haWwiOiJ2ZXRAdGVzdC5jbSIsInJvbGUiOiJ2ZXRlcmluYXJpYW4iLCJhcHAiOiJsYWIiLCJpYXQiOjE3ODEzNDA0NzYsImV4cCI6MTc4MzkzMjQ3Nn0.txx3uJzrxgCsnwJoCxRGM7NKfjsMXVNqAwsQNNYb9cg',
    user: { id:'lab_1781339790886', email:'vet@test.cm', name:'Dr Aminatou Vet', role:'veterinarian', app:'lab', datasetAccess:'none' },
  },
};

// Injecte le token directement dans localStorage (bypass rate limiter)
async function setLabSession(page, role) {
  const { token, user } = TOKENS[role];
  await page.goto('/mokinelab');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('lab_token', token);
    localStorage.setItem('lab_user', JSON.stringify(user));
  }, { token, user });
  await page.goto('/mokinelab/dashboard');
  await page.waitForLoadState('networkidle');
}

// ═══════════════════════════════════════════════════════════════════════════════
// F01 — Landing MokineLab (visiteur non connecté)
// ═══════════════════════════════════════════════════════════════════════════════
test('F01 — Landing MokineLab visiteur', async ({ page }) => {
  await page.goto('/mokinelab');
  await page.waitForLoadState('networkidle');
  await shot(page, '01-landing-guest');

  await expect(page.locator('text=MokineLab').first()).toBeVisible();
  await expect(page.locator('text=Créer mon compte gratuit').first()).toBeVisible();
  await expect(page.locator('text=J\'ai déjà un compte').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F02 — Page Login (UI)
// ═══════════════════════════════════════════════════════════════════════════════
test('F02 — Page Login MokineLab', async ({ page }) => {
  await page.goto('/mokinelab/login');
  await page.waitForLoadState('networkidle');
  await shot(page, '02-login-page');

  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await expect(page.locator('text=Connectez-vous').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F03 — Page Inscription (3 étapes)
// ═══════════════════════════════════════════════════════════════════════════════
test('F03 — Page Inscription 3 étapes', async ({ page }) => {
  await page.goto('/mokinelab/register');
  await page.waitForLoadState('networkidle');
  await shot(page, '03-register-step0');

  // Step 0 : sélection langue
  await expect(page.locator('text=Français').first()).toBeVisible();
  const frBtn = page.locator('button:has-text("Français")').first();
  await frBtn.click();
  await page.waitForTimeout(200);
  // Clic sur Continuer pour passer à l'étape 1
  await page.click('button:has-text("Continuer")');
  await page.waitForTimeout(400);

  await shot(page, '03-register-step1-role');
  // Step 1 : choix rôle — les 3 cards sont visibles
  await expect(page.locator('text=Chercheur').first()).toBeVisible();
  await expect(page.locator('text=Développeur').first()).toBeVisible();
  await expect(page.locator('text=Vétérinaire').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F04 — Dashboard Admin
// ═══════════════════════════════════════════════════════════════════════════════
test('F04 — Dashboard Admin Lab', async ({ page }) => {
  await setLabSession(page, 'admin');
  await shot(page, '04-dashboard-admin');

  // Badge rôle correct
  await expect(page.locator('text=Admin Lab').first()).toBeVisible();
  // Liens admin dans sidebar
  await expect(page.locator('text=Intégration Veto').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F05 — Dashboard Chercheur
// ═══════════════════════════════════════════════════════════════════════════════
test('F05 — Dashboard Chercheur', async ({ page }) => {
  await setLabSession(page, 'researcher');
  await shot(page, '05-dashboard-researcher');

  await expect(page.locator('text=Chercheur').first()).toBeVisible();
  await expect(page.locator('text=Marie Chercheur').first()).toBeVisible();
  // Cards actions
  await expect(page.locator('text=Scan Tebe IA').first()).toBeVisible();
  await expect(page.locator('text=Questionnaire IA').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F06 — Dashboard Développeur (avec alerte dataset)
// ═══════════════════════════════════════════════════════════════════════════════
test('F06 — Dashboard Développeur', async ({ page }) => {
  await setLabSession(page, 'developer');
  await shot(page, '06-dashboard-developer');

  await expect(page.locator('text=Développeur').first()).toBeVisible();
  await expect(page.locator('text=Paul Dev').first()).toBeVisible();
  // Dataset nav link
  await expect(page.locator('text=Dataset').first()).toBeVisible();
  await shot(page, '06-dashboard-developer-full');
});

// ═══════════════════════════════════════════════════════════════════════════════
// F07 — Dashboard Vétérinaire
// ═══════════════════════════════════════════════════════════════════════════════
test('F07 — Dashboard Vétérinaire', async ({ page }) => {
  await setLabSession(page, 'vet');
  await shot(page, '07-dashboard-vet');

  await expect(page.locator('text=Vétérinaire').first()).toBeVisible();
  await expect(page.locator('text=Dr Aminatou Vet').first()).toBeVisible();
  await expect(page.locator('text=À valider').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F08 — Page Scan Tebe IA
// ═══════════════════════════════════════════════════════════════════════════════
test('F08 — Scan Tebe IA', async ({ page }) => {
  await setLabSession(page, 'researcher');
  await page.goto('/mokinelab/scan');
  await page.waitForLoadState('networkidle');
  await shot(page, '08-scan-tebe');

  // La page de scan doit être accessible (pas de redirect login)
  expect(page.url()).not.toMatch(/login/);
  const hasContent = await page.locator('body').innerText();
  expect(hasContent.length).toBeGreaterThan(100);
  await shot(page, '08-scan-full');
});

// ═══════════════════════════════════════════════════════════════════════════════
// F09 — Page Questionnaire IA
// ═══════════════════════════════════════════════════════════════════════════════
test('F09 — Questionnaire IA', async ({ page }) => {
  await setLabSession(page, 'researcher');
  await page.goto('/mokinelab/questionnaire');
  await page.waitForLoadState('networkidle');
  await shot(page, '09-questionnaire');

  expect(page.url()).not.toMatch(/login/);
  const txt = await page.locator('body').innerText();
  expect(txt.length).toBeGreaterThan(100);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F10 — Page Contributions (chercheur soumet)
// ═══════════════════════════════════════════════════════════════════════════════
test('F10 — Page Contributions', async ({ page }) => {
  await setLabSession(page, 'researcher');
  await page.goto('/mokinelab/dashboard/contributions');
  await page.waitForLoadState('networkidle');
  await shot(page, '10-contributions');

  expect(page.url()).not.toMatch(/login/);
  // Au moins un select ou champ de formulaire
  const elems = await page.locator('select, input, textarea, button').count();
  expect(elems).toBeGreaterThan(0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F11 — Page Validation vétérinaire
// ═══════════════════════════════════════════════════════════════════════════════
test('F11 — Validation contributions (vétérinaire)', async ({ page }) => {
  await setLabSession(page, 'vet');
  await page.goto('/mokinelab/dashboard/validate');
  await page.waitForLoadState('networkidle');
  await shot(page, '11-validate');

  expect(page.url()).not.toMatch(/login/);
  const txt = await page.locator('body').innerText();
  expect(txt.length).toBeGreaterThan(50);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F12 — Dataset Request (développeur)
// ═══════════════════════════════════════════════════════════════════════════════
test('F12 — Dataset Request développeur', async ({ page }) => {
  await setLabSession(page, 'developer');
  await page.goto('/mokinelab/dashboard/dataset');
  await page.waitForLoadState('networkidle');
  await shot(page, '12-dataset-request');

  expect(page.url()).not.toMatch(/login/);
  // Bouton de demande ou formulaire
  const elems = await page.locator('button, form, textarea, input').count();
  expect(elems).toBeGreaterThan(0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F13 — Liste + Création modèle (développeur)
// ═══════════════════════════════════════════════════════════════════════════════
test('F13 — Modèles — liste et formulaire création', async ({ page }) => {
  await setLabSession(page, 'developer');
  await page.goto('/mokinelab/dashboard/models');
  await page.waitForLoadState('networkidle');
  await shot(page, '13-models-list');

  expect(page.url()).not.toMatch(/login/);

  // Naviguer vers création
  await page.goto('/mokinelab/dashboard/models/new');
  await page.waitForLoadState('networkidle');
  await shot(page, '13-model-create');

  expect(page.url()).not.toMatch(/login/);
  const elems = await page.locator('input, select, button[type="submit"]').count();
  expect(elems).toBeGreaterThan(0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F14 — Clés API (développeur)
// ═══════════════════════════════════════════════════════════════════════════════
test('F14 — Clés API développeur', async ({ page }) => {
  await setLabSession(page, 'developer');
  await page.goto('/mokinelab/dashboard/api-keys');
  await page.waitForLoadState('networkidle');
  await shot(page, '14-api-keys');

  expect(page.url()).not.toMatch(/login/);
  await expect(page.locator('text=Générer').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F15 — Admin Panel
// ═══════════════════════════════════════════════════════════════════════════════
test('F15 — Admin Panel MokineLab', async ({ page }) => {
  await setLabSession(page, 'admin');
  await page.goto('/mokinelab/dashboard/admin');
  await page.waitForLoadState('networkidle');
  await shot(page, '15-admin-panel');

  expect(page.url()).not.toMatch(/login/);
  const txt = await page.locator('body').innerText();
  expect(txt.length).toBeGreaterThan(100);
});

// ═══════════════════════════════════════════════════════════════════════════════
// F16 — Intégration MokineVeto (admin)
// ═══════════════════════════════════════════════════════════════════════════════
test('F16 — Intégration MokineVeto', async ({ page }) => {
  await setLabSession(page, 'admin');
  await page.goto('/mokinelab/dashboard/integration');
  await page.waitForLoadState('networkidle');
  await shot(page, '16-integration-veto');

  expect(page.url()).not.toMatch(/login/);
  await expect(page.locator('text=MokineVeto').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F17 — Protection routes : accès direct sans token → redirect login
// ═══════════════════════════════════════════════════════════════════════════════
test('F17 — Route protégée redirige vers login', async ({ page }) => {
  // Aucun token injecté — accès direct au dashboard
  await page.goto('/mokinelab/dashboard');
  await page.waitForTimeout(1500);
  await shot(page, '17-protected-redirect');

  // Doit rediriger vers /mokinelab/login
  expect(page.url()).toMatch(/login/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════════════════════════
// F18 — Déconnexion
// ═══════════════════════════════════════════════════════════════════════════════
test('F18 — Déconnexion', async ({ page }) => {
  await setLabSession(page, 'researcher');
  await shot(page, '18-before-logout');

  // Cliquer déconnexion
  await page.click('button:has-text("Déconnexion")');
  await page.waitForTimeout(1200);
  await shot(page, '18-after-logout');

  // Après logout, redirection vers /mokinelab ou login
  expect(page.url()).toMatch(/mokinelab/);
  // Dashboard n'est plus accessible
  await page.goto('/mokinelab/dashboard');
  await page.waitForTimeout(1000);
  expect(page.url()).toMatch(/login/);
  await shot(page, '18-dashboard-blocked-after-logout');
});
