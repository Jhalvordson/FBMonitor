// FBMonitor content script — injected on facebook.com/groups/* pages.
// Scans for keyword matches in post text, highlights matches, and
// notifies the service worker for webhook dispatch.

(function () {
  // console.log("[FBMonitor] loaded on", location.href);

  var currentFeed = null;
  var feedObserver = null;
  var scanTimeout = null;
  var SCAN_DEBOUNCE_MS = 200;
  var FEED_CHECK_INTERVAL_MS = 5000;
  var PERIODIC_SCAN_MS = 3000;

  async function init() {
    var feed = await waitForElement('div[role="feed"]', 30000);
    if (!feed) {
      startPeriodicPageScan();
      return;
    }
    currentFeed = feed;
    observeFeed(feed);
    scanFeed(feed);
    startNavigationWatcher();
    startPeriodicScan();
  }

  function waitForElement(selector, timeoutMs) {
    return new Promise(function (resolve) {
      var el = document.querySelector(selector);
      if (el) return resolve(el);

      var timer = setTimeout(function () {
        obs.disconnect();
        resolve(null);
      }, timeoutMs);

      var obs = new MutationObserver(function () {
        var el = document.querySelector(selector);
        if (el) {
          clearTimeout(timer);
          obs.disconnect();
          resolve(el);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  function observeFeed(feed) {
    if (feedObserver) feedObserver.disconnect();

    feedObserver = new MutationObserver(function () {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(function () {
        scanFeed(feed);
      }, SCAN_DEBOUNCE_MS);
    });

    feedObserver.observe(feed, { childList: true, subtree: true });
  }

  // Main scanning strategy: find all text blocks with dir="auto" in the feed,
  // check each for keyword matches, then highlight the containing feed item.
  // This works regardless of whether posts use role="article" or not.
  async function scanFeed(container) {
    var keywords;
    try {
      keywords = await FBM_Storage.getKeywords();
    } catch (e) {
      return;
    }
    if (!keywords.length) return;

    var highlightEnabled = await FBM_Storage.getHighlightEnabled();
    var templates = {};
    try {
      templates = await FBM_Storage.getReplyTemplates();
    } catch (e) {}

    // Strategy: find all dir="auto" text blocks (Facebook's text rendering)
    var textBlocks = container.querySelectorAll('div[dir="auto"], span[dir="auto"]');

    for (var i = 0; i < textBlocks.length; i++) {
      var block = textBlocks[i];
      if (block.hasAttribute("data-fbm-scanned")) continue;
      block.setAttribute("data-fbm-scanned", "true");

      var text = block.textContent || "";
      if (text.trim().length < 3) continue;

      var matched = matchKeywords(text, keywords);
      if (matched.length === 0) continue;


      // Find the containing feed item to highlight
      var feedItem = findFeedItem(block, container);
      if (!feedItem) continue;
      if (feedItem.classList.contains(FBM_SELECTORS.MATCHED_CLASS)) continue;

      if (highlightEnabled) {
        highlightPost(feedItem, matched);
        injectCopyReplyButton(feedItem, matched, templates);
      }

      var matchData = buildMatchData(feedItem, text, matched, block);
      try {
        chrome.runtime.sendMessage({
          type: FBM_MESSAGE_TYPES.KEYWORD_MATCH,
          payload: matchData,
        });
      } catch (e) {}
    }
  }

  // Walk up from the matched text block to find the feed item container.
  // A feed item is a direct child of the feed, or a child one level deep.
  function findFeedItem(element, feed) {
    var el = element;
    while (el && el !== feed && el !== document.body) {
      if (el.parentElement === feed) return el;
      el = el.parentElement;
    }
    // Fallback: find the closest article
    var article = element.closest('div[role="article"]');
    if (article) return article;
    // Last resort: return the element's grandparent
    if (element.parentElement && element.parentElement.parentElement) {
      return element.parentElement.parentElement;
    }
    return null;
  }

  function matchKeywords(text, keywords) {
    var lowerText = text.toLowerCase();
    return keywords.filter(function (kw) {
      return lowerText.includes(kw.toLowerCase());
    });
  }

  function highlightPost(feedItem, matchedKeywords) {
    if (feedItem.classList.contains(FBM_SELECTORS.MATCHED_CLASS)) return;
    feedItem.classList.add(FBM_SELECTORS.MATCHED_CLASS);
    feedItem.style.position = "relative";

    var badge = document.createElement("div");
    badge.className = FBM_SELECTORS.BADGE_CLASS;
    badge.textContent = "FBM: " + matchedKeywords.join(", ");
    feedItem.prepend(badge);
  }

  function injectCopyReplyButton(feedItem, matchedKeywords, templates) {
    if (feedItem.querySelector("." + FBM_SELECTORS.COPY_BTN_CLASS)) return;

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

    var badge = feedItem.querySelector("." + FBM_SELECTORS.BADGE_CLASS);
    if (badge) {
      badge.after(btn);
    } else {
      feedItem.prepend(btn);
    }
  }

  function buildMatchData(feedItem, text, matchedKeywords, textBlock) {
    var postUrl = findPostUrl(feedItem);
    // If feedItem didn't have a post link, try searching from the text block upward
    if (postUrl === window.location.href && textBlock) {
      var el = textBlock;
      while (el && el !== feedItem) {
        el = el.parentElement;
        if (el) {
          var nearbyUrl = findPostUrl(el);
          if (nearbyUrl !== window.location.href) {
            postUrl = nearbyUrl;
            break;
          }
        }
      }
    }
    // If still no permalink, construct a group search URL so the user
    // can find the post instead of landing at the top of the group
    if (postUrl === window.location.href) {
      var groupMatch = location.pathname.match(/\/groups\/([^/]+)/);
      if (groupMatch) {
        var searchWords = text.trim().split(/\s+/).slice(0, 6).join(" ");
        postUrl =
          "https://www.facebook.com/groups/" +
          groupMatch[1] +
          "/search/?q=" +
          encodeURIComponent(searchWords);
      }
    }
    var authorName = findAuthorName(feedItem);
    var groupName = findGroupName();

    return {
      postText: text.substring(0, FBM_DEFAULTS.MAX_POST_TEXT_LENGTH),
      matchedKeywords: matchedKeywords,
      postUrl: postUrl,
      authorName: authorName,
      groupName: groupName,
      timestamp: Date.now(),
    };
  }

  function findGroupName() {
    // Strategy 1: Open Graph meta tag (most reliable)
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) return ogTitle.content;

    // Strategy 2: The group name link in the header area
    // Facebook group pages have the name as a linked h1 near the top
    var groupHeader = document.querySelector(
      'div[role="main"] h1, div[role="main"] h2',
    );
    if (groupHeader && groupHeader.textContent.trim()) {
      return groupHeader.textContent.trim();
    }

    // Strategy 3: Extract from URL pattern /groups/NAME/
    var urlMatch = location.pathname.match(/\/groups\/([^/]+)/);
    if (urlMatch) {
      var slug = decodeURIComponent(urlMatch[1]);
      if (!/^\d+$/.test(slug)) return slug.replace(/[.-]/g, " ");
    }

    // Strategy 4: Any h1 that's NOT "Notifications" or other Facebook UI
    var h1s = document.querySelectorAll("h1");
    for (var i = 0; i < h1s.length; i++) {
      var text = h1s[i].textContent.trim();
      if (
        text &&
        text !== "Notifications" &&
        text !== "Facebook" &&
        text.length > 1 &&
        text.length < 100
      ) {
        return text;
      }
    }

    return "Unknown Group";
  }

  function findPostUrl(feedItem) {
    var links = feedItem.querySelectorAll("a[href]");
    var candidates = [];

    for (var i = 0; i < links.length; i++) {
      var href = links[i].href || "";
      if (!href || href === "#" || href === "about:blank") continue;

      // Only match actual post permalinks — NOT user profiles, photos, etc.
      if (
        (href.includes("/posts/") || href.includes("/permalink/")) &&
        href.includes("/groups/")
      ) {
        candidates.push(href);
      } else if (href.includes("story_fbid") || href.includes("multi_permalinks")) {
        candidates.push(href);
      }
    }

    if (candidates.length > 0) {
      var best = candidates.find(function (u) {
        return u.includes("/posts/") || u.includes("/permalink/");
      });
      return (best || candidates[0]).split("?")[0];
    }

    // Fallback: look for timestamp links — short text like "1h", "2d", "May 24"
    // These are post permalinks on Facebook
    for (var j = 0; j < links.length; j++) {
      var link = links[j];
      var href = link.href || "";
      var text = (link.textContent || "").trim();
      if (!href || href.includes("/user/") || href.includes("/profile")) continue;

      // Timestamp patterns: "1h", "2d", "3m", "May 24", "Yesterday"
      if (text.match(/^\d+[hmdw]$/) || text.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s/i) || text === "Yesterday" || text === "Just now") {
        if (href.includes("facebook.com") && href !== window.location.href) {
          return href.split("?")[0];
        }
      }
    }

    return window.location.href;
  }

  function findAuthorName(feedItem) {
    // Strategy 1: Look for <strong> tags — Facebook wraps author names in <strong>
    // The first <strong> in a post is almost always the author name
    var strongs = feedItem.querySelectorAll("strong");
    for (var i = 0; i < strongs.length; i++) {
      var text = strongs[i].textContent.trim();
      // Skip non-name patterns: single chars, very long text, contains newlines,
      // looks like a label ("Top contributor", "Admin", etc.)
      if (text.length < 2 || text.length > 50) continue;
      if (text.includes("\n")) continue;
      if (text.match(/^(Top contributor|Admin|Group expert|All-star|Author|Moderator)$/i)) continue;
      // A name should have at least one space (first + last) or be a single name
      // Skip if it's clearly not a name (all lowercase, has special chars)
      if (text.match(/^[a-z]+$/) && text.length < 4) continue;
      return text;
    }

    // Strategy 2: Look for h2/h3 tags which sometimes hold author names
    var headings = feedItem.querySelectorAll("h2, h3");
    for (var j = 0; j < headings.length; j++) {
      var hText = headings[j].textContent.trim();
      if (hText.length > 1 && hText.length < 50 && !hText.includes("\n")) {
        return hText;
      }
    }

    return "Unknown";
  }

  // Periodic re-scan catches new content loaded by scrolling
  function startPeriodicScan() {
    setInterval(function () {
      if (currentFeed && document.body.contains(currentFeed)) {
        scanFeed(currentFeed);
        maybeClickNewPosts();
      }
    }, PERIODIC_SCAN_MS);
  }

  // Auto-click Facebook's "New posts" button when it appears so new posts
  // get rendered into the feed and picked up by the scanner. Safeguards:
  // - only when tab is visible (not background tabs)
  // - 30s minimum between clicks (no spamming)
  // - 2-6s random reaction delay (varied timing, looks human)
  // - re-check button still exists before clicking (race condition guard)
  var lastNewPostsClick = 0;
  function maybeClickNewPosts() {
    if (document.visibilityState !== "visible") return;
    var now = Date.now();
    if (now - lastNewPostsClick < 30000) return;

    var btns = document.querySelectorAll('div[role="button"]');
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      var text = (btn.textContent || "").trim().toLowerCase();
      if (text.includes("new post") || text.match(/^\d+\s+new/)) {
        lastNewPostsClick = now;
        var delay = 2000 + Math.random() * 4000;
        setTimeout(function () {
          if (document.body.contains(btn) && document.visibilityState === "visible") {
            btn.click();
          }
        }, delay);
        return;
      }
    }
  }

  // Fallback: scan the whole page when no feed container exists
  function startPeriodicPageScan() {
    setInterval(function () {
      var feed = document.querySelector('div[role="feed"]');
      if (feed) {
        currentFeed = feed;
        scanFeed(feed);
      } else {
        scanFeed(document.body);
      }
    }, PERIODIC_SCAN_MS);
  }

  // SPA navigation detection
  function startNavigationWatcher() {
    var lastUrl = location.href;
    setInterval(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        reattach();
      }
      if (currentFeed && !document.body.contains(currentFeed)) {
        reattach();
      }
    }, FEED_CHECK_INTERVAL_MS);
  }

  async function reattach() {
    if (!location.href.includes("/groups/")) return;
    if (feedObserver) feedObserver.disconnect();

    var feed = await waitForElement('div[role="feed"]', 10000);
    if (feed) {
      currentFeed = feed;
      observeFeed(feed);
      scanFeed(feed);
    } else {
      scanFeed(document.body);
    }
  }

  // Listen for config changes from popup/options
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === FBM_MESSAGE_TYPES.CONFIG_UPDATED) {
      // Clear all scan markers so everything gets re-checked
      var scanned = document.querySelectorAll("[data-fbm-scanned]");
      scanned.forEach(function (el) {
        el.removeAttribute("data-fbm-scanned");
      });
      if (currentFeed) {
        scanFeed(currentFeed);
      } else {
        scanFeed(document.body);
      }
    }
  });

  init();
})();
