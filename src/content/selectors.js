// FBMonitor Facebook DOM selectors — isolated in one file.
// When Facebook changes their DOM, update ONLY this file.
// Uses ARIA roles (stable accessibility features) instead of obfuscated CSS classes.

const FBM_SELECTORS = {
  // Main feed container — ARIA role has been stable for years
  FEED_CONTAINER: 'div[role="feed"]',

  // Individual posts within the feed
  POST_ARTICLE: 'div[role="article"]',

  // Text content candidates within a post (ordered by reliability)
  POST_TEXT_CANDIDATES: ['div[data-ad-preview="message"]', 'div[dir="auto"]'],

  // Post permalink patterns
  POST_LINK_SELECTORS: [
    'a[href*="/groups/"][href*="/posts/"]',
    'a[href*="/groups/"][href*="/permalink/"]',
    'a[href*="story_fbid"]',
  ],

  // Author name
  AUTHOR_SELECTORS: ["h3 a", "h4 a", 'a[role="link"] strong', "strong a"],

  // Our custom attributes/classes
  PROCESSED_ATTR: "data-fbmonitor-processed",
  MATCHED_CLASS: "fbmonitor-matched",
  BADGE_CLASS: "fbmonitor-badge",
  COPY_BTN_CLASS: "fbmonitor-copy-btn",
};

if (typeof window !== "undefined") {
  window.FBM_SELECTORS = FBM_SELECTORS;
}
