// Tests for storage wrapper.
// Chrome APIs are mocked in tests/setup.js.

// Inline the storage module for testing (can't use ES modules in Jest without build)
const KEYS = {
  KEYWORDS: "fbmonitor_keywords",
  WEBHOOK_URL: "fbmonitor_webhook_url",
  WEBHOOK_ENABLED: "fbmonitor_webhook_on",
  HIGHLIGHT_ENABLED: "fbmonitor_highlight_on",
  REPLY_TEMPLATES: "fbmonitor_reply_templates",
  MATCH_HISTORY: "fbmonitor_matches",
  SENT_HASHES: "fbmonitor_sent_hashes",
};

const Storage = {
  async getKeywords() {
    const result = await chrome.storage.sync.get(KEYS.KEYWORDS);
    return result[KEYS.KEYWORDS] || [];
  },

  async setKeywords(keywords) {
    await chrome.storage.sync.set({ [KEYS.KEYWORDS]: keywords });
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
};

describe("Storage - Keywords", () => {
  beforeEach(() => {
    global.__resetChromeStorage();
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
  });

  test("getKeywords returns empty array when no keywords stored", async () => {
    const keywords = await Storage.getKeywords();
    expect(keywords).toEqual([]);
  });

  test("addKeyword adds a new keyword", async () => {
    const result = await Storage.addKeyword("insurance");
    expect(result).toContain("insurance");
    expect(chrome.storage.sync.set).toHaveBeenCalled();
  });

  test("addKeyword lowercases and trims input", async () => {
    const result = await Storage.addKeyword("  Insurance  ");
    expect(result).toContain("insurance");
  });

  test("addKeyword ignores empty strings", async () => {
    const result = await Storage.addKeyword("   ");
    expect(result).toEqual([]);
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  test("addKeyword ignores duplicates", async () => {
    await Storage.addKeyword("insurance");
    const result = await Storage.addKeyword("insurance");
    const unique = result.filter((k) => k === "insurance");
    expect(unique.length).toBe(1);
  });

  test("removeKeyword removes a keyword", async () => {
    await Storage.addKeyword("insurance");
    await Storage.addKeyword("agent");
    const result = await Storage.removeKeyword("insurance");
    expect(result).not.toContain("insurance");
    expect(result).toContain("agent");
  });
});
