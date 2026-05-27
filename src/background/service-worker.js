// FBMonitor service worker — handles webhook dispatch, dedup, and rate limiting.

import { formatTeamsPayload, simpleHash } from "../shared/webhook.js";

const STORAGE_KEYS = {
  KEYWORDS: "fbmonitor_keywords",
  WEBHOOK_URL: "fbmonitor_webhook_url",
  WEBHOOK_ENABLED: "fbmonitor_webhook_on",
  MATCH_HISTORY: "fbmonitor_matches",
  SENT_HASHES: "fbmonitor_sent_hashes",
  RATE_LIMIT_SEC: "fbmonitor_rate_limit",
};

const DEFAULTS = {
  RATE_LIMIT_SEC: 10,
  MAX_HISTORY_SIZE: 500,
  HASH_EXPIRY_MS: 24 * 60 * 60 * 1000,
};

const MESSAGE_TYPES = {
  KEYWORD_MATCH: "KEYWORD_MATCH",
  CONFIG_UPDATED: "CONFIG_UPDATED",
  GET_MATCH_QUEUE: "GET_MATCH_QUEUE",
  CLEAR_MATCH_QUEUE: "CLEAR_MATCH_QUEUE",
};

let lastWebhookTime = 0;
const pendingQueue = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.KEYWORD_MATCH) {
    handleKeywordMatch(message.payload);
    sendResponse({ received: true });
  }

  if (message.type === MESSAGE_TYPES.GET_MATCH_QUEUE) {
    getMatchHistory().then((history) => sendResponse({ matches: history }));
    return true;
  }

  if (message.type === MESSAGE_TYPES.CLEAR_MATCH_QUEUE) {
    chrome.storage.local.remove(STORAGE_KEYS.MATCH_HISTORY);
    sendResponse({ cleared: true });
  }

  return false;
});

// Alarm-based queue flush (survives service worker restarts)
chrome.alarms.create("fbmonitor-flush", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fbmonitor-flush") {
    flushPendingQueue();
  }
});

async function handleKeywordMatch(payload) {
  // Hash on post text + keywords (not URL, which can be unreliable)
  const textSnippet = (payload.postText || "").substring(0, 100);
  const hash = simpleHash(textSnippet + payload.matchedKeywords.join(","));

  const sentHashes = await getSentHashes();
  if (
    sentHashes[hash] &&
    Date.now() - sentHashes[hash] < DEFAULTS.HASH_EXPIRY_MS
  ) {
    return;
  }

  // Mark as sent immediately to prevent duplicate history entries
  await markHashSent(hash);
  await addMatch(payload);
  await updateBadge();

  const webhookEnabled = await getWebhookEnabled();
  if (!webhookEnabled) return;

  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) return;

  const now = Date.now();
  const rateLimitMs = (await getRateLimitSec()) * 1000;

  if (now - lastWebhookTime < rateLimitMs) {
    pendingQueue.push({ hash, payload });
    return;
  }

  await sendWebhook(webhookUrl, hash, payload);
}

async function sendWebhook(webhookUrl, hash, payload) {
  lastWebhookTime = Date.now();

  const body = formatTeamsPayload(payload);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      await markHashSent(hash);
    }
  } catch {
    // Failed — will retry on next alarm flush
    pendingQueue.push({ hash, payload });
  }
}

async function flushPendingQueue() {
  if (pendingQueue.length === 0) return;

  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) return;

  const item = pendingQueue.shift();
  if (item) {
    await sendWebhook(webhookUrl, item.hash, item.payload);
  }
}

async function updateBadge() {
  const history = await getMatchHistory();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = history.filter(
    (m) => m.timestamp >= todayStart.getTime(),
  ).length;

  chrome.action.setBadgeText({
    text: todayCount > 0 ? String(todayCount) : "",
  });
  chrome.action.setBadgeBackgroundColor({ color: "#ff6600" });
}

// Storage helpers (service worker can't use window.FBM_Storage)
async function getWebhookEnabled() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.WEBHOOK_ENABLED);
  return result[STORAGE_KEYS.WEBHOOK_ENABLED] || false;
}

async function getWebhookUrl() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WEBHOOK_URL);
  return result[STORAGE_KEYS.WEBHOOK_URL] || "";
}

async function getRateLimitSec() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.RATE_LIMIT_SEC);
  return result[STORAGE_KEYS.RATE_LIMIT_SEC] || DEFAULTS.RATE_LIMIT_SEC;
}

async function getMatchHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MATCH_HISTORY);
  return result[STORAGE_KEYS.MATCH_HISTORY] || [];
}

async function addMatch(match) {
  const history = await getMatchHistory();
  history.unshift(match);
  if (history.length > DEFAULTS.MAX_HISTORY_SIZE) {
    history.length = DEFAULTS.MAX_HISTORY_SIZE;
  }
  await chrome.storage.local.set({
    [STORAGE_KEYS.MATCH_HISTORY]: history,
  });
}

async function getSentHashes() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SENT_HASHES);
  return result[STORAGE_KEYS.SENT_HASHES] || {};
}

async function markHashSent(hash) {
  const hashes = await getSentHashes();
  hashes[hash] = Date.now();
  const cutoff = Date.now() - DEFAULTS.HASH_EXPIRY_MS;
  for (const [k, v] of Object.entries(hashes)) {
    if (v < cutoff) delete hashes[k];
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.SENT_HASHES]: hashes });
}
