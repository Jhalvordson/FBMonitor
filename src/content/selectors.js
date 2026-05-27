// FBMonitor Facebook DOM selectors — isolated in one file.
// When Facebook changes their DOM, update ONLY this file.
// Uses ARIA roles (stable accessibility features) instead of obfuscated CSS classes.
// Uses var so it's accessible from content.js in the same isolated world.

/* eslint-disable no-var */
var FBM_SELECTORS = {
  FEED_CONTAINER: 'div[role="feed"]',
  POST_ARTICLE: 'div[role="article"]',
  POST_TEXT_CANDIDATES: ['div[data-ad-preview="message"]', 'div[dir="auto"]'],
  POST_LINK_SELECTORS: [
    'a[href*="/groups/"][href*="/posts/"]',
    'a[href*="/groups/"][href*="/permalink/"]',
    'a[href*="story_fbid"]',
  ],
  AUTHOR_SELECTORS: ["h3 a", "h4 a", 'a[role="link"] strong', "strong a"],
  PROCESSED_ATTR: "data-fbmonitor-processed",
  MATCHED_CLASS: "fbmonitor-matched",
  BADGE_CLASS: "fbmonitor-badge",
  COPY_BTN_CLASS: "fbmonitor-copy-btn",
};
