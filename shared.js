/* ═══════════════════════════════════════════════
   VOTEFLOW — SHARED JAVASCRIPT
   Developer: Aniket Shrivastava
   workwithaniket7456@gmail.com
═══════════════════════════════════════════════ */
'use strict';

// ── Email Config ─────────────────────────────────────────────
const EMAIL_CONFIG = {
    EMAILJS_PUBLIC_KEY: 'WVtzgv8tLs9VY2BCA',
    EMAILJS_SERVICE_ID: 'Service_3196qek',
    TEMPLATE_ID: 'template_n3885gq',
    BACKEND_URL: '',  // Set to your Node.js backend URL to use Option 2
    SENDER_EMAIL: 'aniketshrivastava880@gmail.com',
    FEEDBACK_EMAIL: 'workwithaniket7456@gmail.com',
};

// ── EmailJS Service ──────────────────────────────────────────
const EmailService = {
    _ready: false,
    init() {
        if (window.emailjs && EMAIL_CONFIG.EMAILJS_PUBLIC_KEY !== 'YOUR_KEY') {
            try { emailjs.init({ publicKey: EMAIL_CONFIG.EMAILJS_PUBLIC_KEY }); this._ready = true; } catch (e) { }
        }
    },
    async send(type, params) {
        if (EMAIL_CONFIG.BACKEND_URL) return this._backend(type, params);
        if (this._ready) return this._emailjs(type, params);
        return this._demo(type, params);
    },
    async _backend(type, params) {
        try {
            const r = await fetch(`${EMAIL_CONFIG.BACKEND_URL}/api/email/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            return { ok: true, method: 'backend' };
        } catch (e) { return this._ready ? this._emailjs(type, params) : this._demo(type, params); }
    },
    async _emailjs(type, params) {
        try {
            await emailjs.send(EMAIL_CONFIG.EMAILJS_SERVICE_ID, EMAIL_CONFIG.TEMPLATE_ID, {
                to_name: params.to_name || 'User',
                to_email: params.to_email,
                subject: params.subject || 'VoteFlow Notification',
                message: params.message || '',
                otp_code: params.otp_code || '',
                username: params.username || params.to_name || '',
                from_name: 'VoteFlow by Aniket Shrivastava',
                from_email: EMAIL_CONFIG.SENDER_EMAIL,
                reply_to: EMAIL_CONFIG.SENDER_EMAIL,
            });
            return { ok: true, method: 'emailjs' };
        } catch (e) { console.error('[EmailJS]', e.text || e); return this._demo(type, params); }
    },
    _demo(type, params) {
        if (type === 'otp') console.info(`[VoteFlow DEMO OTP] ${params.otp_code}`);
        return { ok: false, method: 'demo', otp: params.otp_code };
    },
};

// ── Storage ──────────────────────────────────────────────────
const Store = {
    get(k) { try { return JSON.parse(localStorage.getItem('vf_' + k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('vf_' + k, JSON.stringify(v)); } catch (e) { } },
    load() {
        return {
            users: this.get('users') || [],
            elections: this.get('elections') || [],
            voterGroups: this.get('groups') || [],
            votes: this.get('votes') || [],
            feedbacks: this.get('feedbacks') || [],
            theme: this.get('theme') || 'other-dark',
            category: this.get('category') || null,
        };
    },
    save(data) {
        if (data.users) this.set('users', data.users);
        if (data.elections) this.set('elections', data.elections);
        if (data.voterGroups) this.set('groups', data.voterGroups);
        if (data.votes) this.set('votes', data.votes);
        if (data.feedbacks) this.set('feedbacks', data.feedbacks);
    },
};

// ── App State (shared across pages via localStorage) ─────────
const App = Store.load();
App.currentUser = null;  // set from sessionStorage on each page

// ── Session ──────────────────────────────────────────────────
function saveSession(user) { sessionStorage.setItem('vf_session', JSON.stringify(user)); }
function loadSession() { try { return JSON.parse(sessionStorage.getItem('vf_session') || 'null'); } catch (e) { return null; } }
function clearSession() { sessionStorage.removeItem('vf_session'); }
function requireAuth() { const u = loadSession(); if (!u) { window.location = 'login.html'; return null; } return u; }

// ── Theme ────────────────────────────────────────────────────
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t || 'other-dark');
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = (t || '').includes('dark') ? '☀️' : '🌙';
}
function toggleTheme() {
    const cur = Store.get('theme') || 'other-dark';
    const parts = cur.split('-');
    const next = parts[0] + '-' + (parts[1] === 'dark' ? 'light' : 'dark');
    Store.set('theme', next); Store.set('category', parts[0]);
    App.theme = next; applyTheme(next);
}

// ── Nav helpers ──────────────────────────────────────────────
function initNav() {
    const user = loadSession();
    const navUser = document.getElementById('nav-user-area');
    const navGuest = document.getElementById('nav-guest-area');
    const navAvatar = document.getElementById('nav-avatar-letter');
    const navName = document.getElementById('nav-username-display');
    const authLinks = document.querySelectorAll('[data-auth]');
    if (user) {
        App.currentUser = user;
        if (navUser) { navUser.style.display = 'flex'; }
        if (navGuest) { navGuest.style.display = 'none'; }
        if (navAvatar) navAvatar.textContent = user.username[0].toUpperCase();
        if (navName) navName.textContent = user.username;
        authLinks.forEach(l => l.style.display = 'block');
    } else {
        if (navUser) { navUser.style.display = 'none'; }
        if (navGuest) { navGuest.style.display = 'flex'; }
        authLinks.forEach(l => l.style.display = 'none');
    }
    // Hamburger mobile menu
    const hb = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hb && navLinks) {
        hb.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'var(--nav-bg)';
            navLinks.style.padding = '1rem';
            navLinks.style.borderBottom = '1px solid var(--border)';
        });
    }
    // Set active nav link
    const cur = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a[href]').forEach(a => {
        if (a.getAttribute('href') === cur) a.classList.add('active');
    });
}
function logout() {
    clearSession();
    showToast('Logged out', 'info');
    setTimeout(() => window.location = 'index.html', 800);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
    t.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 300); }, duration);
}

// ── Modal ────────────────────────────────────────────────────
function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; } }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); document.body.style.overflow = ''; } }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('open'); document.body.style.overflow = ''; } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; }); });

// ── Utilities ────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function togglePass(inputId, btn) { const i = document.getElementById(inputId); if (!i) return; i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? '👁️' : '🙈'; }
function generateCode(name, phone, cls, isSchool) {
    const n = String(name).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const p = String(phone).replace(/\D/g, '').slice(0, 4);
    const c = isSchool ? String(cls || '').toUpperCase().replace(/\s+/g, '') : '';
    return n + p + c;
}

// ── Election timer checker ───────────────────────────────────
function checkElectionTimers() {
    const now = Date.now();
    let changed = false;
    App.elections.forEach(e => {
        if (e.status === 'upcoming' && e.startTime && now >= new Date(e.startTime).getTime()) { e.status = 'live'; changed = true; }
        if (e.status === 'live' && e.timingType === 'scheduled' && e.endTime && now >= new Date(e.endTime).getTime()) { e.status = 'ended'; changed = true; }
    });
    if (changed) Store.save({ elections: App.elections });
}

// ── Feedback ─────────────────────────────────────────────────
let _pickedEmoji = {};
function pickEmoji(btn, key) {
    const row = btn.closest('.emoji-row');
    if (row) row.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('picked'));
    btn.classList.add('picked');
    _pickedEmoji[key] = btn.textContent;
}
function submitPageFeedback(page) {
    const txt = $(page + '-fb-text');
    const text = txt?.value?.trim();
    const emoji = _pickedEmoji[page];
    if (!emoji && !text) { showToast('Pick a rating or write a message', 'warn'); return; }
    const fb = { id: 'fb-' + Date.now(), page, emoji: emoji || '😐', text: text || '', user: App.currentUser?.username || 'Guest', time: new Date().toISOString() };
    App.feedbacks.push(fb); Store.save({ feedbacks: App.feedbacks });
    if (txt) txt.value = '';
    _pickedEmoji[page] = null;
    document.querySelectorAll(`[data-fb="${page}"] .emoji-btn`).forEach(b => b.classList.remove('picked'));
    // Send to workwithaniket7456@gmail.com
    EmailService.send('feedback', {
        to_email: EMAIL_CONFIG.FEEDBACK_EMAIL,
        to_name: 'Aniket',
        subject: `VoteFlow Feedback — ${page}`,
        message: `Page: ${page}\nRating: ${emoji || '—'}\nComment: ${text || '—'}\nUser: ${fb.user}\nTime: ${new Date().toLocaleString()}`,
    });
    showToast('Feedback sent! Thank you 💬', 'success');
}

// ── Shared Footer & Feedback HTML builder ───────────────────
function injectFeedbackAndFooter(pageKey) {
    const fb = `
  <section class="feedback-section" data-fb="${pageKey}">
    <div class="feedback-inner">
      <h3>💬 Quick Feedback</h3>
      <div class="emoji-row">
        <button class="emoji-btn" onclick="pickEmoji(this,'${pageKey}')" title="Loved it">😍</button>
        <button class="emoji-btn" onclick="pickEmoji(this,'${pageKey}')" title="Good">😊</button>
        <button class="emoji-btn" onclick="pickEmoji(this,'${pageKey}')" title="Okay">😐</button>
        <button class="emoji-btn" onclick="pickEmoji(this,'${pageKey}')" title="Needs work">😕</button>
      </div>
      <div class="feedback-form">
        <input type="text" class="form-input" id="${pageKey}-fb-text" placeholder="Share thoughts about this page..."/>
        <button class="btn btn-primary" style="padding:0.6rem 1.2rem;font-size:0.88rem" onclick="submitPageFeedback('${pageKey}')">Send</button>
      </div>
    </div>
  </section>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo"><div class="nav-logo-badge">🗳️</div>VoteFlow</a>
          <p>Making democratic processes simple, fair, and transparent.</p>
        </div>
        <div class="footer-col"><h4>Platform</h4><ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="register.html">Register</a></li>
          <li><a href="voter-login.html">Voter Login</a></li>
          <li><a href="about.html">About</a></li>
        </ul></div>
        <div class="footer-col"><h4>Account</h4><ul>
          <li><a href="login.html">Login</a></li>
          <li><a href="dashboard.html">Dashboard</a></li>
          <li><a href="history.html">History</a></li>
          <li><a href="feedback.html">Feedback</a></li>
        </ul></div>
      </div>
      <div class="footer-bottom">
        <span class="footer-copy">© 2024 VoteFlow. All rights reserved.</span>
        <span class="footer-dev">Developed by Aniket Shrivastava</span>
        <span class="footer-email">📧 workwithaniket7456@gmail.com</span>
      </div>
    </div>
  </footer>`;
    const target = document.getElementById('page-footer-slot');
    if (target) target.innerHTML = fb;
}

// ── Init on every page ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const data = Store.load();
    Object.assign(App, data);
    applyTheme(App.theme || 'other-dark');
    EmailService.init();
    initNav();
});