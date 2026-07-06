/**
 * ============================================================
 * PRETTY KIT — window.js
 * Cyberpunk Glassmorphism Desktop Window Framework
 * Tauri 2 Compatible
 * ============================================================
 */

/**
 * In Tauri v2 with withGlobalTauri:false, __TAURI__ is NOT injected.
 * Instead, detect Tauri via __TAURI_INTERNALS__ which IS always present
 * in a Tauri WebView regardless of the withGlobalTauri setting.
 */
const IS_TAURI = typeof window !== 'undefined' &&
  '__TAURI_INTERNALS__' in window;

// ── Tauri API shim ───────────────────────────────────────────
let _tauriWindow = null;

async function getTauriWindow() {
  if (!IS_TAURI) return null;
  if (_tauriWindow) return _tauriWindow;
  try {
    // Tauri 2.x — getCurrentWebviewWindow lives on webviewWindow, not window
    const mod = await import('@tauri-apps/api/webviewWindow');
    _tauriWindow = mod.getCurrentWebviewWindow();
  } catch (e) {
    console.warn('[PrettyKit] Could not load Tauri webviewWindow API:', e);
  }
  return _tauriWindow;
}

// ── Internal state ────────────────────────────────────────────
const _state = {
  title:       'Pretty Kit',
  icon:        '',
  accentColor: null,
  isMaximized: false,
  statusText:  'READY',
  version:     'v1.0.0',
};

// ── DOM refs (resolved after DOMContentLoaded) ────────────────
const $ = (id) => document.getElementById(id);
let _els = {};

function _resolveEls() {
  _els = {
    window:      $('pretty-window'),
    titlebar:    $('pretty-titlebar'),
    icon:        $('pretty-icon'),
    title:       $('pretty-title'),
    controls:    $('pretty-controls'),
    content:     $('pretty-content'),
    statusbar:   $('pretty-statusbar'),
    statusText:  $('pk-status-text'),
    statusVer:   $('pk-status-version'),
    btnMin:      $('pk-minimize'),
    btnMax:      $('pk-maximize'),
    btnClose:    $('pk-close'),
    maxIcon:     $('pk-max-icon'),
    restoreIcon: $('pk-restore-icon'),
  };
}

// ═════════════════════════════════════════════════════════════
//  PUBLIC API
// ═════════════════════════════════════════════════════════════

function createPrettyWindow(options = {}) {
  const {
    title       = 'Pretty Kit',
    icon        = '',
    accentColor = 'aqua',
    version     = 'v1.0.0',
    statusText  = 'READY',
    showStatus  = true,
  } = options;

  setTitle(title);
  setIcon(icon);
  setAccentColor(accentColor);
  setVersion(version);
  setStatusText(statusText);

  if (!showStatus && _els.statusbar) {
    _els.statusbar.style.display = 'none';
  }

  return _instance;
}

function setTitle(title) {
  _state.title = title;
  if (_els.title) _els.title.textContent = title;
  document.title = title;
  if (IS_TAURI) {
    getTauriWindow().then(win => win?.setTitle?.(title));
  }
}

function setIcon(icon) {
  _state.icon = icon;
  if (!_els.icon) return;
  const el = _els.icon;
  if (!icon) { el.style.display = 'none'; return; }
  if ([...icon].length <= 2 && isNaN(Number(icon))) {
    el.tagName === 'IMG' && el.replaceWith(_makeSpanIcon(icon));
    return;
  }
  el.src = icon;
  el.style.display = '';
}

function setAccentColor(color) {
  _state.accentColor = color;
  if (!_els.window) return;
  const namedPresets = new Set(['aqua', 'pink', 'violet', 'green', 'orange']);
  const el = _els.window;
  el.removeAttribute('data-accent');
  if (!color) return;
  if (namedPresets.has(color)) {
    if (color !== 'aqua') el.setAttribute('data-accent', color);
  } else {
    el.style.setProperty('--accent',      color);
    el.style.setProperty('--accent-glow', _hexToGlow(color, 0.40));
    el.style.setProperty('--accent-dim',  _hexToGlow(color, 0.12));
    el.style.setProperty('--holo-border', _hexToGlow(color, 0.30));
    el.style.setProperty('--holo-border-hover', _hexToGlow(color, 0.75));
  }
}

function setStatusText(text) {
  _state.statusText = text;
  if (_els.statusText) _els.statusText.textContent = text.toUpperCase();
}

function setVersion(ver) {
  _state.version = ver;
  if (_els.statusVer) _els.statusVer.textContent = ver;
}

async function minimize() {
  if (IS_TAURI) {
    const win = await getTauriWindow();
    await win?.minimize?.();
  } else {
    _els.window && (_els.window.style.transform = 'scale(0.95)');
    setTimeout(() => _els.window && (_els.window.style.transform = ''), 200);
  }
}

async function toggleMaximize() {
  if (IS_TAURI) {
    const win = await getTauriWindow();
    await win?.toggleMaximize?.();
    const maximized = await win?.isMaximized?.();
    _setMaximizedState(maximized ?? !_state.isMaximized);
  } else {
    _setMaximizedState(!_state.isMaximized);
  }
}

async function close() {
  if (IS_TAURI) {
    const win = await getTauriWindow();
    await win?.close?.();
  } else {
    window.close();
  }
}

// ═════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ═════════════════════════════════════════════════════════════

function _setMaximizedState(isMaximized) {
  _state.isMaximized = isMaximized;
  if (!_els.btnMax) return;
  _els.btnMax.classList.toggle('is-maximized', isMaximized);
  _els.btnMax.setAttribute('aria-label', isMaximized ? 'Restore window' : 'Maximize window');
  _els.btnMax.title = isMaximized ? 'Restore' : 'Maximize';
  if (_els.maxIcon)     _els.maxIcon.style.display     = isMaximized ? 'none' : '';
  if (_els.restoreIcon) _els.restoreIcon.style.display = isMaximized ? ''     : 'none';
  if (_els.window) {
    _els.window.style.borderRadius = isMaximized ? '0' : '';
  }
}

function _hexToGlow(hex, alpha = 0.4) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(0,255,255,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function _makeSpanIcon(emoji) {
  const span = document.createElement('span');
  span.id = 'pretty-icon';
  span.className = 'icon-placeholder';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = emoji;
  span.style.cssText = 'font-size:18px;line-height:1;width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  return span;
}

function _bindControls() {
  _els.btnMin?.addEventListener('click', (e) => {
    e.stopPropagation();
    minimize();
  });

  _els.btnMax?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMaximize();
  });

  _els.btnClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  _els.titlebar?.addEventListener('dblclick', () => {
    toggleMaximize();
  });

  // `-webkit-app-region: drag` only works in WebKit-based webviews
  // (macOS/Linux). Windows uses WebView2 (Chromium), which ignores it,
  // so we fall back to Tauri's native startDragging() there.
  _els.titlebar?.addEventListener('mousedown', async (e) => {
    if (!IS_TAURI) return;
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input')) return;
    const win = await getTauriWindow();
    win?.startDragging?.();
  });
}

async function _bindTauriEvents() {
  if (!IS_TAURI) return;
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const win = getCurrentWebviewWindow();
    await win.listen('tauri://resize', async () => {
      const maximized = await win.isMaximized();
      if (typeof maximized === 'boolean') _setMaximizedState(maximized);
    });
  } catch (e) {
    console.warn('[PrettyKit] Could not bind resize listener:', e);
  }
}

// ═════════════════════════════════════════════════════════════
//  INIT
// ═════════════════════════════════════════════════════════════

function _init() {
  _resolveEls();
  _bindControls();
  _bindTauriEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}

// ═════════════════════════════════════════════════════════════
//  EXPORTED INSTANCE
// ═════════════════════════════════════════════════════════════

const _instance = {
  createPrettyWindow,
  setTitle,
  setIcon,
  setAccentColor,
  setStatusText,
  setVersion,
  minimize,
  toggleMaximize,
  close,
  get state() { return { ..._state }; },
  get content() { return _els.content ?? null; },
};

export default _instance;
export {
  createPrettyWindow,
  setTitle,
  setIcon,
  setAccentColor,
  setStatusText,
  setVersion,
  minimize,
  toggleMaximize,
  close,
};
