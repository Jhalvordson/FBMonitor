// FBMonitor shared constants — loaded before all other scripts via manifest order.
// Content scripts and popup both read these. Service worker imports as ES module.

const FBM_STORAGE_KEYS = {
  KEYWORDS: "fbmonitor_keywords",
  WEBHOOK_URL: "fbmonitor_webhook_url",
  WEBHOOK_ENABLED: "fbmonitor_webhook_on",
  HIGHLIGHT_ENABLED: "fbmonitor_highlight_on",
  REPLY_TEMPLATES: "fbmonitor_reply_templates",
  MATCH_HISTORY: "fbmonitor_matches",
  SENT_HASHES: "fbmonitor_sent_hashes",
  RATE_LIMIT_SEC: "fbmonitor_rate_limit",
};

const FBM_MESSAGE_TYPES = {
  KEYWORD_MATCH: "KEYWORD_MATCH",
  CONFIG_UPDATED: "CONFIG_UPDATED",
  GET_MATCH_QUEUE: "GET_MATCH_QUEUE",
  CLEAR_MATCH_QUEUE: "CLEAR_MATCH_QUEUE",
};

const FBM_DEFAULTS = {
  RATE_LIMIT_SEC: 10,
  MAX_POST_TEXT_LENGTH: 500,
  MAX_HISTORY_SIZE: 500,
  HASH_EXPIRY_MS: 24 * 60 * 60 * 1000,
};

if (typeof window !== "undefined") {
  window.FBM_STORAGE_KEYS = FBM_STORAGE_KEYS;
  window.FBM_MESSAGE_TYPES = FBM_MESSAGE_TYPES;
  window.FBM_DEFAULTS = FBM_DEFAULTS;
}
