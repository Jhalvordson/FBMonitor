// FBMonitor storage wrapper — abstracts chrome.storage.sync and chrome.storage.local.
// Uses var so it's accessible from content.js and popup.js.

/* eslint-disable no-var */
var FBM_Storage = {
  async getKeywords() {
    const result = await chrome.storage.sync.get(FBM_STORAGE_KEYS.KEYWORDS);
    return result[FBM_STORAGE_KEYS.KEYWORDS] || [];
  },

  async setKeywords(keywords) {
    await chrome.storage.sync.set({ [FBM_STORAGE_KEYS.KEYWORDS]: keywords });
  },

  async addKeyword(keyword) {
    const keywords = await this.getKeywords();
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed)) return keywords;
    keywords.push(trimmed);
    await this.setKeywords(keywords);
    return keywords;
  },

  async removeKeyword(keyword) {
    const keywords = await this.getKeywords();
    const filtered = keywords.filter((k) => k !== keyword);
    await this.setKeywords(filtered);
    return filtered;
  },

  async getHighlightEnabled() {
    const result = await chrome.storage.sync.get(
      FBM_STORAGE_KEYS.HIGHLIGHT_ENABLED,
    );
    const val = result[FBM_STORAGE_KEYS.HIGHLIGHT_ENABLED];
    return val === undefined ? true : val;
  },

  async setHighlightEnabled(enabled) {
    await chrome.storage.sync.set({
      [FBM_STORAGE_KEYS.HIGHLIGHT_ENABLED]: enabled,
    });
  },

  async getWebhookEnabled() {
    const result = await chrome.storage.sync.get(
      FBM_STORAGE_KEYS.WEBHOOK_ENABLED,
    );
    return result[FBM_STORAGE_KEYS.WEBHOOK_ENABLED] || false;
  },

  async setWebhookEnabled(enabled) {
    await chrome.storage.sync.set({
      [FBM_STORAGE_KEYS.WEBHOOK_ENABLED]: enabled,
    });
  },

  async getWebhookUrl() {
    const result = await chrome.storage.local.get(
      FBM_STORAGE_KEYS.WEBHOOK_URL,
    );
    return result[FBM_STORAGE_KEYS.WEBHOOK_URL] || "";
  },

  async setWebhookUrl(url) {
    await chrome.storage.local.set({ [FBM_STORAGE_KEYS.WEBHOOK_URL]: url });
  },

  async getReplyTemplates() {
    const result = await chrome.storage.sync.get(
      FBM_STORAGE_KEYS.REPLY_TEMPLATES,
    );
    return result[FBM_STORAGE_KEYS.REPLY_TEMPLATES] || {};
  },

  async setReplyTemplates(templates) {
    await chrome.storage.sync.set({
      [FBM_STORAGE_KEYS.REPLY_TEMPLATES]: templates,
    });
  },

  async getMatchHistory() {
    const result = await chrome.storage.local.get(
      FBM_STORAGE_KEYS.MATCH_HISTORY,
    );
    return result[FBM_STORAGE_KEYS.MATCH_HISTORY] || [];
  },

  async addMatch(match) {
    const history = await this.getMatchHistory();
    history.unshift(match);
    if (history.length > FBM_DEFAULTS.MAX_HISTORY_SIZE) {
      history.length = FBM_DEFAULTS.MAX_HISTORY_SIZE;
    }
    await chrome.storage.local.set({
      [FBM_STORAGE_KEYS.MATCH_HISTORY]: history,
    });
  },

  async clearMatchHistory() {
    await chrome.storage.local.remove(FBM_STORAGE_KEYS.MATCH_HISTORY);
  },

  async getSentHashes() {
    const result = await chrome.storage.local.get(
      FBM_STORAGE_KEYS.SENT_HASHES,
    );
    return result[FBM_STORAGE_KEYS.SENT_HASHES] || {};
  },

  async addSentHash(hash) {
    const hashes = await this.getSentHashes();
    hashes[hash] = Date.now();
    const cutoff = Date.now() - FBM_DEFAULTS.HASH_EXPIRY_MS;
    for (const [k, v] of Object.entries(hashes)) {
      if (v < cutoff) delete hashes[k];
    }
    await chrome.storage.local.set({
      [FBM_STORAGE_KEYS.SENT_HASHES]: hashes,
    });
  },

  async hasSentHash(hash) {
    const hashes = await this.getSentHashes();
    const ts = hashes[hash];
    if (!ts) return false;
    if (Date.now() - ts > FBM_DEFAULTS.HASH_EXPIRY_MS) return false;
    return true;
  },

  async getRateLimitSec() {
    const result = await chrome.storage.sync.get(
      FBM_STORAGE_KEYS.RATE_LIMIT_SEC,
    );
    return (
      result[FBM_STORAGE_KEYS.RATE_LIMIT_SEC] || FBM_DEFAULTS.RATE_LIMIT_SEC
    );
  },
};
