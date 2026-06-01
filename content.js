/**
 * DarkShield Content Script (content.js)
 * Tracks user interaction metrics and extracts text candidates for classification.
 */

// Global tracking state for the 14-dimensional feature vector
let interactionState = {
  cancel_link_count: 0,
  hidden_cancel_ratio: 0,
  modal_count: 0,
  modal_reappear_rate: 0,
  urgency_score: 0,
  button_size_ratio: 1.0,
  form_field_count: 0,
  redirect_count: 0,
  countdown_timer: 0,
  confirmshame: 0,
  number_of_clicks_to_cancel: 0,
  button_enabled_after_seconds: 0,
  background_blocked_duration: 0,
  dom_mutations_per_minute: 0,
};

// Rolling history queue of the last 10 snapshots for the BiLSTM
let featureHistory = [];

let mutationCount = 0;
let mutationCounterStartTime = Date.now();
let backgroundBlockedStartTime = null;
let backgroundBlockedTotal = 0;

/**
 * Initialize all interaction trackers when page loads
 */
function initializeTracking() {
  trackModals();
  trackCancelLinks();
  trackUrgencyText();
  trackFormFields();
  trackHistoryChanges();
  trackButtonInteractions();
  trackDOMMutations();
  trackBackgroundBlocking();
  
  // Record the first snapshot and start the snapshot interval
  recordSnapshot();
  setInterval(recordSnapshot, 2000);
  
  console.log("DarkShield interaction tracking initialized.");
}

/**
 * Take a snapshot of the current 14-dimensional feature state and add to rolling queue
 */
function recordSnapshot() {
  const snapshot = {
    cancel_link_count: interactionState.cancel_link_count,
    hidden_cancel_ratio: interactionState.hidden_cancel_ratio,
    modal_count: interactionState.modal_count,
    modal_reappear_rate: interactionState.modal_reappear_rate,
    urgency_score: interactionState.urgency_score,
    button_size_ratio: calculateButtonSizeRatio(),
    form_field_count: interactionState.form_field_count,
    redirect_count: interactionState.redirect_count,
    countdown_timer: detectCountdownTimer(),
    confirmshame: detectConfirmshaming(),
    number_of_clicks_to_cancel: estimateClicksToCancel(),
    button_enabled_after_seconds: interactionState.button_enabled_after_seconds,
    background_blocked_duration: interactionState.background_blocked_duration,
    dom_mutations_per_minute: interactionState.dom_mutations_per_minute,
  };
  
  featureHistory.push(snapshot);
  if (featureHistory.length > 10) {
    featureHistory.shift();
  }
}

/**
 * 1. Track Modal/Popup appearances and re-appearances
 */
function trackModals() {
  const modals = new Map();
  const observer = new MutationObserver(() => {
    const visibleModals = document.querySelectorAll('[role="dialog"], .modal, .popup, [aria-modal="true"]');
    visibleModals.forEach(modal => {
      const id = modal.id || modal.getAttribute('aria-label') || 'unknown-modal';
      if (!modals.has(id)) {
        modals.set(id, { count: 1, lastSeen: Date.now() });
        interactionState.modal_count++;
      } else {
        const info = modals.get(id);
        const timeSinceLastSeen = Date.now() - info.lastSeen;
        if (timeSinceLastSeen > 5000) { // Re-appearance after 5s
          info.count++;
          interactionState.modal_reappear_rate = Math.min(5, interactionState.modal_reappear_rate + 0.1);
        }
        info.lastSeen = Date.now();
        modals.set(id, info);
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * 2. Track cancel, skip, exit, decline link counts and hidden links
 */
function trackCancelLinks() {
  const cancelPattern = /cancel|unsubscribe|no thanks|back|decline|skip|close|exit|not now/i;
  const updateCancelLinks = () => {
    let cancelCount = 0;
    let hiddenCancelCount = 0;
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      const text = el.textContent?.trim() || '';
      if (cancelPattern.test(text)) {
        cancelCount++;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || el.offsetWidth === 0) {
          hiddenCancelCount++;
        }
      }
    });
    interactionState.cancel_link_count = cancelCount;
    interactionState.hidden_cancel_ratio = cancelCount > 0 ? hiddenCancelCount / cancelCount : 0;
  };
  updateCancelLinks();
  setInterval(updateCancelLinks, 2000);
}

/**
 * 3. Track text nodes containing high-pressure/urgency language
 */
function trackUrgencyText() {
  const urgencyPattern = /only\s+\d+|hurry|expires|limited\s+time|last\s+chance|act\s+now|don't\s+wait/i;
  const updateUrgency = () => {
    let urgencyCount = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (urgencyPattern.test(node.textContent)) {
        urgencyCount++;
      }
    }
    interactionState.urgency_score = Math.min(1.0, urgencyCount / 10);
  };
  updateUrgency();
  setInterval(updateUrgency, 3000);
}

/**
 * 4. Track input and form fields count
 */
function trackFormFields() {
  const updateFormFields = () => {
    interactionState.form_field_count = document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select'
    ).length;
  };
  updateFormFields();
  setInterval(updateFormFields, 2000);
}

/**
 * 5. Track redirect and navigation actions
 */
function trackHistoryChanges() {
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  history.pushState = function(...args) {
    interactionState.redirect_count++;
    return pushState.apply(history, args);
  };
  history.replaceState = function(...args) {
    interactionState.redirect_count++;
    return replaceState.apply(history, args);
  };
}

/**
 * 6. Track CTAs and delay in enabling buttons
 */
function trackButtonInteractions() {
  document.querySelectorAll('button, [role="button"]').forEach(btn => {
    if (btn.disabled) {
      const observer = new MutationObserver(() => {
        if (!btn.disabled) {
          const enableTime = Date.now();
          const disabledTime = parseInt(btn.dataset.disabledTime || Date.now());
          interactionState.button_enabled_after_seconds = Math.max(
            interactionState.button_enabled_after_seconds,
            Math.round((enableTime - disabledTime) / 1000)
          );
          observer.disconnect();
        }
      });
      btn.dataset.disabledTime = Date.now().toString();
      observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] });
    }
  });
}

/**
 * 7. Track DOM mutations rate
 */
function trackDOMMutations() {
  const observer = new MutationObserver(() => {
    mutationCount++;
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  setInterval(() => {
    const elapsedSeconds = (Date.now() - mutationCounterStartTime) / 1000;
    if (elapsedSeconds > 0) {
      interactionState.dom_mutations_per_minute = Math.round((mutationCount / elapsedSeconds) * 60);
    }
  }, 3000);
}

/**
 * 8. Track duration background is blocked by modal overlays
 */
function trackBackgroundBlocking() {
  const updateBlocking = () => {
    const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [aria-modal="true"]');
    if (modals.length > 0) {
      if (!backgroundBlockedStartTime) {
        backgroundBlockedStartTime = Date.now();
      }
    } else {
      if (backgroundBlockedStartTime) {
        backgroundBlockedTotal += (Date.now() - backgroundBlockedStartTime) / 1000;
        backgroundBlockedStartTime = null;
      }
    }
    interactionState.background_blocked_duration = Math.round(backgroundBlockedTotal + 
      (backgroundBlockedStartTime ? (Date.now() - backgroundBlockedStartTime) / 1000 : 0)
    );
  };
  setInterval(updateBlocking, 500);
}

/**
 * Dynamic Helpers for visual countdown/confirmshame detection
 */
function detectCountdownTimer() {
  const timerPattern = /\d{1,2}:\d{2}(:\d{2})?/;
  let found = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    if (timerPattern.test(node.textContent)) {
      const parent = node.parentElement;
      if (parent) {
        const style = window.getComputedStyle(parent);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          found = 1;
          break;
        }
      }
    }
  }
  return found;
}

function detectConfirmshaming() {
  const shamingWords = /no thanks.*save|don't want|i prefer to pay more|keep full price|no, I hate|no, I'd rather/i;
  let found = 0;
  document.querySelectorAll('button, a, span, p').forEach(el => {
    if (shamingWords.test(el.textContent || '')) {
      found = 1;
    }
  });
  return found;
}

function estimateClicksToCancel() {
  const cancelPattern = /cancel|unsubscribe|delete account|remove/i;
  let clicks = 0;
  document.querySelectorAll('a, button').forEach(el => {
    if (cancelPattern.test(el.textContent || '')) {
      clicks++;
    }
  });
  return Math.min(20, clicks);
}

function calculateButtonSizeRatio() {
  const ctas = document.querySelectorAll('.btn-primary, .cta, [class*="submit"], button[type="submit"]');
  const cancels = document.querySelectorAll('[class*="cancel"], [class*="decline"], .btn-secondary');
  if (ctas.length === 0 || cancels.length === 0) return 1.0;
  
  let maxCtaArea = 0;
  ctas.forEach(c => {
    maxCtaArea = Math.max(maxCtaArea, c.offsetWidth * c.offsetHeight);
  });
  let minCancelArea = Infinity;
  cancels.forEach(c => {
    const area = c.offsetWidth * c.offsetHeight;
    if (area > 0) {
      minCancelArea = Math.min(minCancelArea, area);
    }
  });
  if (minCancelArea === Infinity || minCancelArea === 0) return 1.0;
  return Math.min(10.0, maxCtaArea / minCancelArea);
}

/**
 * Text Candidates Extraction for ELECTRA
 */
function extractTextCandidates() {
  const candidates = new Set();
  
  // 1. Buttons, links, CTAs
  document.querySelectorAll('button, a, [role="button"]').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length >= 8 && text.length <= 150) {
      candidates.add(text);
    }
  });
  
  // 2. Heads and titles
  document.querySelectorAll('h1, h2, h3, h4').forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length >= 8 && text.length <= 150) {
      candidates.add(text);
    }
  });

  // 3. Short paragraph blocks and spans (promotions, banners)
  document.querySelectorAll('p, span, div').forEach(el => {
    if (el.children.length === 0) {
      const text = el.textContent?.trim();
      if (text && text.length >= 10 && text.length <= 150 && text.split(/\s+/).length <= 25) {
        candidates.add(text);
      }
    }
  });

  // 4. Elements with suspicious styling / attributes
  const selectors = [
    '[class*="urgency"]', '[class*="stock"]', '[class*="timer"]', 
    '[class*="limited"]', '[class*="countdown"]', '[class*="modal"]'
  ];
  selectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length >= 8 && text.length <= 180) {
          candidates.add(text);
        }
      });
    } catch (_) {}
  });

  // Deduplicate and filter down to top 80 candidates
  return Array.from(candidates)
    .filter(t => t.length > 5)
    .slice(0, 80);
}

/**
 * Message Handler
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TEXT_CANDIDATES") {
    sendResponse({ success: true, data: extractTextCandidates() });
  } else if (request.type === "GET_INTERACTION_FEATURES") {
    // Return the rolling history of snapshots
    if (featureHistory.length === 0) {
      recordSnapshot();
    }
    sendResponse({ success: true, data: featureHistory });
  } else if (request.type === "GET_VIEWPORT_DIMENSIONS") {
    sendResponse({
      width: window.innerWidth || document.documentElement.clientWidth || 1024,
      height: window.innerHeight || document.documentElement.clientHeight || 768
    });
  }
  return true;
});

// Run trackers when content script starts
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeTracking();
} else {
  document.addEventListener("DOMContentLoaded", initializeTracking);
}
