// LEARN: This script fetches webmentions from webmention.io and caches them
// as JSON for build-time rendering — avoids client-side API calls on every page load.
// Run with: npm run webmentions

import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// LEARN: replaces lodash.unionBy — importing all of lodash (~25KB) for one function is wasteful.
// Keeps items from `primary`, then appends items from `secondary` whose key isn't already present.
const unionBy = (primary, secondary, key) => {
  const seen = new Set(primary.map((i) => i[key]));
  return [...primary, ...secondary.filter((i) => !seen.has(i[key]))];
};

const CACHE_FILE = "src/data/webmentions.json";
const DOMAIN = "ruwaizrazak.com";
const TOKEN = process.env.WEBMENTION_API_KEY;

if (!TOKEN) {
  console.error(">>> Missing WEBMENTION_API_KEY in .env");
  process.exit(1);
}

async function fetchWebmentions(since, perPage = 100) {
  const allChildren = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    let url = `https://webmention.io/api/mentions.jf2?domain=${DOMAIN}&token=${TOKEN}&per-page=${perPage}&page=${page}`;
    if (since) {
      const sinceDate = new Date(since);
      const now = new Date();
      if (sinceDate > now) {
        console.log(">>> Warning: lastFetched was in the future, resetting to now");
        since = now.toISOString();
      }
      url += `&since=${since}`;
    }

    console.log(`>>> Fetching page ${page}...`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`>>> Error: ${response.status} ${await response.text()}`);
      hasMore = false;
      continue;
    }

    const feed = await response.json();
    if (feed.children?.length > 0) {
      allChildren.push(...feed.children);
      console.log(`>>> ${feed.children.length} mentions on page ${page}`);
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`>>> Total fetched: ${allChildren.length}`);
  return { children: allChildren };
}

function readFromCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    console.log(`>>> Cache: ${cache.children.length} mentions, last fetched ${cache.lastFetched}`);
    return cache;
  }
  return { lastFetched: null, children: [] };
}

function writeToCache(data) {
  const dir = CACHE_FILE.substring(0, CACHE_FILE.lastIndexOf("/"));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  console.log(`>>> Saved ${data.children.length} mentions to ${CACHE_FILE}`);
}

async function run() {
  const cache = readFromCache();
  const feed = await fetchWebmentions(cache.lastFetched);

  // Deduplicate by wm-id when merging cached + fresh mentions
  const merged = unionBy(feed.children, cache.children, "wm-id");

  writeToCache({
    lastFetched: new Date().toISOString(),
    children: merged,
  });
}

run();
