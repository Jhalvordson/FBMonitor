// FBMonitor content script — injected on facebook.com/groups/* pages.
// Watches the feed for new posts, scans for keyword matches,
// highlights matching posts, and notifies the service worker.

(function () {
  let feedObserver = null;
  let currentFeed = null;
  let scanTimeout = null;
  const SCAN_DEBOUNCE_MS = 150;
  const FEED_CHECK_INTERVAL_MS = 5000;

  async function init() {
    const feed = await waitForFeed();
    if (!feed) return;
    observeFeed(feed);
    scanExistingPosts(feed);
    startNavigationWatcher();
  }

  function waitForFeed() {
    return new Promise((resolve) => {
      const feed = document.querySelector(FBM_SELECTORS.FEED_CONTAINER);
      if (feed) return resolve(feed);

      const timeout = setTimeout(() => {
        bodyObs.disconnect();
        resolve(null);
      }, 15000);

      const bodyObs = new MutationObserver(() => {
        const feed = document.querySelector(FBM_SELECTORS.FEED_CONTAINER);
        if (feed) {
          clearTimeout(timeout);
          bodyObs.disconnect();
          resolve(feed);
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
    });
  }

  function observeFeed(feed) {
    if (feedObserver) feedObserver.disconnect();
    currentFeed = feed;

    feedObserver = new MutationObserver(() => {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(() => scanNewPosts(feed), SCAN_DEBOUNCE_MS);
    });

    feedObserver.observe(feed, { childList: true, subtree: true });
  }

  function scanExistingPosts(feed) {
    const articles = feed.querySelectorAll(FBM_SELECTORS.POST_ARTICLE);
    articles.forEach((article) => scanPost(article));
  }

  function scanNewPosts(feed) {
    const articles = feed.querySelectorAll(
      `${FBM_SELECTORS.POST_ARTICLE}:not([${FBM_SELECTORS.PROCESSED_ATTR}])`,
    );
    articles.forEach((article) => scanPost(article));
  }

  async function scanPost(articleEl) {
    if (articleEl.hasAttribute(FBM_SELECTORS.PROCESSED_ATTR)) return;
    articleEl.setAttribute(FBM_SELECTORS.PROCESSED_ATTR, "true");

    const keywords = await FBM_Storage.getKeywords();
    if (!keywords.length) return;

    const highlightEnabled = await FBM_Storage.getHighlightEnabled();
    const text = extractPostText(articleEl);
    if (!text.trim()) return;

    const matched = matchKeywords(text, keywords);
    if (matched.length === 0) return;

    if (highlightEnabled) {
      highlightPost(articleEl, matched);
      injectCopyReplyButton(articleEl, matched);
    }

    const matchData = buildMatchData(articleEl, text, matched);
    chrome.runtime.sendMessage({
      type: FBM_MESSAGE_TYPES.KEYWORD_MATCH,
      payload: matchData,
    });
  }

  function extractPostText(articleEl) {
    for (const selector of FBM_SELECTORS.POST_TEXT_CANDIDATES) {
      const candidates = articleEl.querySelectorAll(selector);
      if (candidates.length > 0) {
        const texts = Array.from(candidates).map((el) => el.innerText);
        const combined = texts.join(" ");
        if (combined.trim().length > 10) return combined;
      }
    }
    return articleEl.innerText || "";
  }

  function matchKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
  }

  function highlightPost(articleEl, matchedKeywords) {
    articleEl.classList.add(FBM_SELECTORS.MATCHED_CLASS);

    const badge = document.createElement("div");
    badge.className = FBM_SELECTORS.BADGE_CLASS;
    badge.textContent = `FBM: ${matchedKeywords.join(", ")}`;
    articleEl.style.position = "relative";
    articleEl.prepend(badge);
  }

  async function injectCopyReplyButton(articleEl, matchedKeywords) {
    const templates = await FBM_Storage.getReplyTemplates();
    const firstMatchTemplate = matchedKeywords
      .map((kw) => templates[kw])
      .find((t) => t);

    if (!firstMatchTemplate) return;

    const btn = document.createElement("button");
    btn.className = FBM_SELECTORS.COPY_BTN_CLASS;
    btn.textContent = "Copy Reply";
    btn.title = "Copy reply template to clipboard";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(firstMatchTemplate);
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy Reply"), 2000);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => (btn.textContent = "Copy Reply"), 2000);
      }
    });

    const badge = articleEl.querySelector(`.${FBM_SELECTORS.BADGE_CLASS}`);
    if (badge) {
      badge.after(btn);
    } else {
      articleEl.prepend(btn);
    }
  }

  function buildMatchData(articleEl, text, matchedKeywords) {
    let postUrl = window.location.href;
    for (const selector of FBM_SELECTORS.POST_LINK_SELECTORS) {
      const link = articleEl.querySelector(selector);
      if (link) {
        postUrl = link.href;
        break;
      }
    }

    let authorName = "Unknown";
    for (const selector of FBM_SELECTORS.AUTHOR_SELECTORS) {
      const el = articleEl.querySelector(selector);
      if (el && el.innerText.trim()) {
        authorName = el.innerText.trim();
        break;
      }
    }

    const groupName =
      document.querySelector("h1")?.innerText || "Unknown Group";

    return {
      postText: text.substring(0, FBM_DEFAULTS.MAX_POST_TEXT_LENGTH),
      matchedKeywords,
      postUrl,
      authorName,
      groupName,
      timestamp: Date.now(),
    };
  }

  // SPA navigation detection — Facebook is a single-page app
  function startNavigationWatcher() {
    let lastUrl = location.href;

    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        reattachIfNeeded();
      }
      // Also check if feed was replaced (React reconciliation)
      if (currentFeed && !document.body.contains(currentFeed)) {
        reattachIfNeeded();
      }
    }, FEED_CHECK_INTERVAL_MS);
  }

  async function reattachIfNeeded() {
    if (!location.href.includes("/groups/")) return;
    if (feedObserver) feedObserver.disconnect();

    const feed = await waitForFeed();
    if (feed) {
      observeFeed(feed);
      scanExistingPosts(feed);
    }
  }

  // Listen for config changes from popup/options
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === FBM_MESSAGE_TYPES.CONFIG_UPDATED) {
      if (currentFeed) {
        // Re-scan with new keywords (clear processed flags)
        const articles = currentFeed.querySelectorAll(
          `[${FBM_SELECTORS.PROCESSED_ATTR}]`,
        );
        articles.forEach((a) =>
          a.removeAttribute(FBM_SELECTORS.PROCESSED_ATTR),
        );
        scanExistingPosts(currentFeed);
      }
    }
  });

  init();
})();
