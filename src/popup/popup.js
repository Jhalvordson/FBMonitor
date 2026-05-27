// FBMonitor popup — keyword management, toggles, and match queue.

document.addEventListener("DOMContentLoaded", async () => {
  const keywordInput = document.getElementById("keyword-input");
  const addKeywordBtn = document.getElementById("add-keyword-btn");
  const keywordListEl = document.getElementById("keyword-list");
  const highlightToggle = document.getElementById("highlight-toggle");
  const webhookToggle = document.getElementById("webhook-toggle");
  const matchQueueEl = document.getElementById("match-queue");
  const matchCountEl = document.getElementById("match-count");
  const clearMatchesBtn = document.getElementById("clear-matches-btn");
  const optionsBtn = document.getElementById("options-btn");

  // Load initial state
  await renderKeywords();
  highlightToggle.checked = await FBM_Storage.getHighlightEnabled();
  webhookToggle.checked = await FBM_Storage.getWebhookEnabled();
  await renderMatchQueue();

  // Add keyword
  async function addKeyword() {
    const value = keywordInput.value.trim();
    if (!value) return;
    await FBM_Storage.addKeyword(value);
    keywordInput.value = "";
    await renderKeywords();
    notifyContentScripts();
  }

  addKeywordBtn.addEventListener("click", addKeyword);
  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addKeyword();
  });

  // Toggle handlers
  highlightToggle.addEventListener("change", async () => {
    await FBM_Storage.setHighlightEnabled(highlightToggle.checked);
    notifyContentScripts();
  });

  webhookToggle.addEventListener("change", async () => {
    await FBM_Storage.setWebhookEnabled(webhookToggle.checked);
  });

  // Clear matches
  clearMatchesBtn.addEventListener("click", async () => {
    chrome.runtime.sendMessage({ type: FBM_MESSAGE_TYPES.CLEAR_MATCH_QUEUE });
    await renderMatchQueue();
  });

  // Options page
  optionsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Render keyword chips
  async function renderKeywords() {
    const keywords = await FBM_Storage.getKeywords();
    keywordListEl.innerHTML = "";

    if (keywords.length === 0) {
      keywordListEl.innerHTML =
        '<span class="empty-state">No keywords configured</span>';
      return;
    }

    keywords.forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "keyword-chip";

      const text = document.createElement("span");
      text.textContent = kw;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-keyword";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", async () => {
        await FBM_Storage.removeKeyword(kw);
        await renderKeywords();
        notifyContentScripts();
      });

      chip.appendChild(text);
      chip.appendChild(removeBtn);
      keywordListEl.appendChild(chip);
    });
  }

  // Render match queue
  async function renderMatchQueue() {
    const response = await chrome.runtime.sendMessage({
      type: FBM_MESSAGE_TYPES.GET_MATCH_QUEUE,
    });

    const matches = response?.matches || [];

    // Update count — today only
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMatches = matches.filter(
      (m) => m.timestamp >= todayStart.getTime(),
    );
    matchCountEl.textContent = todayMatches.length;

    matchQueueEl.innerHTML = "";

    if (matches.length === 0) {
      matchQueueEl.innerHTML =
        '<p class="empty-state">No matches yet. Start scrolling a group!</p>';
      return;
    }

    // Show last 20 matches
    const recentMatches = matches.slice(0, 20);
    const templates = await FBM_Storage.getReplyTemplates();

    recentMatches.forEach((match) => {
      const item = document.createElement("div");
      item.className = "match-item";

      const firstKwTemplate = (match.matchedKeywords || [])
        .map((kw) => templates[kw])
        .find((t) => t);

      item.innerHTML = `
        <div class="match-item-header">
          <span class="match-group" title="${escapeHtml(match.groupName || "")}">${escapeHtml(match.groupName || "Unknown")}</span>
          <span class="match-keywords">${escapeHtml((match.matchedKeywords || []).join(", "))}</span>
        </div>
        <div class="match-text">${escapeHtml(match.postText || "")}</div>
        <div class="match-actions">
          <button class="btn btn-sm btn-secondary go-to-post" data-url="${escapeHtml(match.postUrl || "")}">Open</button>
          ${firstKwTemplate ? `<button class="btn btn-sm btn-copy copy-reply" data-reply="${escapeHtml(firstKwTemplate)}">Copy Reply</button>` : ""}
        </div>
      `;

      matchQueueEl.appendChild(item);
    });

    // Event delegation for match actions
    matchQueueEl.addEventListener("click", async (e) => {
      const goBtn = e.target.closest(".go-to-post");
      if (goBtn) {
        const url = goBtn.dataset.url;
        if (url) chrome.tabs.create({ url });
      }

      const copyBtn = e.target.closest(".copy-reply");
      if (copyBtn) {
        const reply = copyBtn.dataset.reply;
        if (reply) {
          await navigator.clipboard.writeText(reply);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy Reply"), 2000);
        }
      }
    });
  }

  function notifyContentScripts() {
    chrome.tabs.query({ url: "https://www.facebook.com/groups/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: FBM_MESSAGE_TYPES.CONFIG_UPDATED,
        });
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
