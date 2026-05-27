// FBMonitor content script — injected on facebook.com/groups/* pages.
// Watches the feed for new posts, scans for keyword matches,
// highlights matching posts, and notifies the service worker.

(function () {
  console.log("[FBMonitor] Content script loaded on", location.href);

  var feedObserver = null;
  var currentFeed = null;
  var scanTimeout = null;
  var SCAN_DEBOUNCE_MS = 150;
  var FEED_CHECK_INTERVAL_MS = 5000;
  var PERIODIC_SCAN_MS = 3000;

  async function init() {
    console.log("[FBMonitor] Waiting for feed container...");
    var feed = await waitForFeed();
    if (!feed) {
      console.warn("[FBMonitor] Feed container not found within timeout.");
      return;
    }
    console.log("[FBMonitor] Feed found, starting observer.");
    observeFeed(feed);
    scanExistingPosts(feed);
    startNavigationWatcher();
    startPeriodicScan();
  }

  function waitForFeed() {
    return new Promise(function (resolve) {
      var feed = document.querySelector(FBM_SELECTORS.FEED_CONTAINER);
      if (feed) return resolve(feed);

      var timeout = setTimeout(function () {
        bodyObs.disconnect();
        resolve(null);
      }, 30000);

      var bodyObs = new MutationObserver(function () {
        var feed = document.querySelector(FBM_SELECTORS.FEED_CONTAINER);
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

    feedObserver = new MutationObserver(function () {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(function () {
        scanNewPosts(feed);
      }, SCAN_DEBOUNCE_MS);
    });

    feedObserver.observe(feed, { childList: true, subtree: true });
  }

  function scanExistingPosts(feed) {
    var articles = feed.querySelectorAll(FBM_SELECTORS.POST_ARTICLE);
    console.log("[FBMonitor] Scanning", articles.length, "existing posts");
    articles.forEach(function (article) {
      scanPost(article);
    });
  }

  function scanNewPosts(feed) {
    var articles = feed.querySelectorAll(
      FBM_SELECTORS.POST_ARTICLE +
        ":not([" +
        FBM_SELECTORS.PROCESSED_ATTR +
        "])",
    );
    if (articles.length > 0) {
      console.log("[FBMonitor] Scanning", articles.length, "new posts");
    }
    articles.forEach(function (article) {
      scanPost(article);
    });
  }

  async function scanPost(articleEl) {
    if (articleEl.hasAttribute(FBM_SELECTORS.PROCESSED_ATTR)) return;
    articleEl.setAttribute(FBM_SELECTORS.PROCESSED_ATTR, "true");

    var keywords;
    try {
      keywords = await FBM_Storage.getKeywords();
    } catch (e) {
      console.error("[FBMonitor] Failed to get keywords:", e);
      return;
    }

    console.log("[FBMonitor] Keywords from storage:", JSON.stringify(keywords));
    if (!keywords.length) return;

    var highlightEnabled = await FBM_Storage.getHighlightEnabled();
    var text = extractPostText(articleEl);
    console.log(
      "[FBMonitor] Extracted text (" + text.length + " chars):",
      text.substring(0, 120),
    );
    if (!text.trim()) return;

    var matched = matchKeywords(text, keywords);
    console.log("[FBMonitor] Match result:", JSON.stringify(matched));
    if (matched.length === 0) return;

    console.log("[FBMonitor] MATCH FOUND:", matched, "in:", text.substring(0, 80));

    if (highlightEnabled) {
      highlightPost(articleEl, matched);
      injectCopyReplyButton(articleEl, matched);
    }

    var matchData = buildMatchData(articleEl, text, matched);
    try {
      chrome.runtime.sendMessage({
        type: FBM_MESSAGE_TYPES.KEYWORD_MATCH,
        payload: matchData,
      });
    } catch (e) {
      console.warn("[FBMonitor] Failed to notify service worker:", e);
    }
  }

  function extractPostText(articleEl) {
    // Strategy 1: specific selectors
    for (var i = 0; i < FBM_SELECTORS.POST_TEXT_CANDIDATES.length; i++) {
      var selector = FBM_SELECTORS.POST_TEXT_CANDIDATES[i];
      var candidates = articleEl.querySelectorAll(selector);
      if (candidates.length > 0) {
        var texts = [];
        candidates.forEach(function (el) {
          var t = el.innerText || el.textContent || "";
          if (t.trim()) texts.push(t);
        });
        var combined = texts.join(" ");
        if (combined.trim().length > 10) return combined;
      }
    }

    // Strategy 2: grab all text from the article
    return articleEl.innerText || articleEl.textContent || "";
  }

  function matchKeywords(text, keywords) {
    var lowerText = text.toLowerCase();
    return keywords.filter(function (kw) {
      return lowerText.includes(kw.toLowerCase());
    });
  }

  function highlightPost(articleEl, matchedKeywords) {
    if (articleEl.classList.contains(FBM_SELECTORS.MATCHED_CLASS)) return;
    articleEl.classList.add(FBM_SELECTORS.MATCHED_CLASS);

    var badge = document.createElement("div");
    badge.className = FBM_SELECTORS.BADGE_CLASS;
    badge.textContent = "FBM: " + matchedKeywords.join(", ");
    articleEl.style.position = "relative";
    articleEl.prepend(badge);
  }

  async function injectCopyReplyButton(articleEl, matchedKeywords) {
    if (articleEl.querySelector("." + FBM_SELECTORS.COPY_BTN_CLASS)) return;

    var templates;
    try {
      templates = await FBM_Storage.getReplyTemplates();
    } catch (e) {
      return;
    }

    var firstMatchTemplate = null;
    for (var i = 0; i < matchedKeywords.length; i++) {
      if (templates[matchedKeywords[i]]) {
        firstMatchTemplate = templates[matchedKeywords[i]];
        break;
      }
    }

    if (!firstMatchTemplate) return;

    var btn = document.createElement("button");
    btn.className = FBM_SELECTORS.COPY_BTN_CLASS;
    btn.textContent = "Copy Reply";
    btn.title = "Copy reply template to clipboard";
    btn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(firstMatchTemplate);
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = "Copy Reply";
        }, 2000);
      } catch (err) {
        btn.textContent = "Failed";
        setTimeout(function () {
          btn.textContent = "Copy Reply";
        }, 2000);
      }
    });

    var badge = articleEl.querySelector("." + FBM_SELECTORS.BADGE_CLASS);
    if (badge) {
      badge.after(btn);
    } else {
      articleEl.prepend(btn);
    }
  }

  function buildMatchData(articleEl, text, matchedKeywords) {
    var postUrl = window.location.href;
    for (var i = 0; i < FBM_SELECTORS.POST_LINK_SELECTORS.length; i++) {
      var link = articleEl.querySelector(FBM_SELECTORS.POST_LINK_SELECTORS[i]);
      if (link) {
        postUrl = link.href;
        break;
      }
    }

    var authorName = "Unknown";
    for (var j = 0; j < FBM_SELECTORS.AUTHOR_SELECTORS.length; j++) {
      var el = articleEl.querySelector(FBM_SELECTORS.AUTHOR_SELECTORS[j]);
      if (el && (el.innerText || "").trim()) {
        authorName = el.innerText.trim();
        break;
      }
    }

    var h1 = document.querySelector("h1");
    var groupName = h1 ? h1.innerText : "Unknown Group";

    return {
      postText: text.substring(0, FBM_DEFAULTS.MAX_POST_TEXT_LENGTH),
      matchedKeywords: matchedKeywords,
      postUrl: postUrl,
      authorName: authorName,
      groupName: groupName,
      timestamp: Date.now(),
    };
  }

  // Periodic re-scan — catches posts missed by MutationObserver and handles
  // the case where keywords were added after initial page load.
  function startPeriodicScan() {
    setInterval(function () {
      if (currentFeed && document.body.contains(currentFeed)) {
        scanNewPosts(currentFeed);
      }
    }, PERIODIC_SCAN_MS);
  }

  // SPA navigation detection — Facebook is a single-page app
  function startNavigationWatcher() {
    var lastUrl = location.href;

    setInterval(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("[FBMonitor] Navigation detected:", lastUrl);
        reattachIfNeeded();
      }
      if (currentFeed && !document.body.contains(currentFeed)) {
        console.log("[FBMonitor] Feed detached, re-attaching...");
        reattachIfNeeded();
      }
    }, FEED_CHECK_INTERVAL_MS);
  }

  async function reattachIfNeeded() {
    if (!location.href.includes("/groups/")) return;
    if (feedObserver) feedObserver.disconnect();

    var feed = await waitForFeed();
    if (feed) {
      observeFeed(feed);
      scanExistingPosts(feed);
    }
  }

  // Listen for config changes from popup/options
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === FBM_MESSAGE_TYPES.CONFIG_UPDATED) {
      console.log("[FBMonitor] Config updated, re-scanning...");
      if (currentFeed) {
        var articles = currentFeed.querySelectorAll(
          "[" + FBM_SELECTORS.PROCESSED_ATTR + "]",
        );
        articles.forEach(function (a) {
          a.removeAttribute(FBM_SELECTORS.PROCESSED_ATTR);
        });
        scanExistingPosts(currentFeed);
      }
    }
  });

  init();
})();
