import * as psl from "psl";

const enc = new TextDecoder("utf-8");

type Heuristics = {
  body?: boolean;
  param?: boolean;
  contentType?: boolean;
  isStellate?: boolean;
};
const requests = new Map<string, Heuristics>();
const tabs = new Map<number, Heuristics>();

/**
 * On Message is used for communicating between the popup and this background script
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  sendResponse(handlers[message.type]?.(message) || null);
});
const handlers = {
  getResult: (message) => tabs.get(message.tabId),
};

/**
 * On Before Request checks for GraphQL-related data in the body
 */
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      if (!(await checkFirstPartyRequest(details))) return;

      const isBody = isJSONGraphQLBody(details);
      const isParam = isGraphQLQueryParam(details);
      if (!isBody && !isParam) return;

      requests.set(details.requestId, {
        ...(requests.get(details.requestId) ?? {}),
        body: isBody,
        param: isParam,
      });
    } catch (err) {
      console.error(err);
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

/**
 * On Headers Received checks for the X-Powered-By: Stellate header
 */
chrome.webRequest.onHeadersReceived.addListener(
  async (details) => {
    try {
      if (!(await checkFirstPartyRequest(details))) return;

      const isStellate = !!details.responseHeaders?.find(
        (header) =>
          header.name === "x-powered-by" &&
          header.value.toLowerCase() === "stellate"
      );
      if (!isStellate) return;

      requests.set(details.requestId, {
        ...(requests.get(details.requestId) ?? {}),
        isStellate,
      });
    } catch (err) {
      console.error(err);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

/**
 * On Send Headers checks for GraphQL-related headers
 */
chrome.webRequest.onSendHeaders.addListener(
  async (details) => {
    try {
      if (!(await checkFirstPartyRequest(details))) return;

      const isContentType = isGraphQLContentType(details);
      if (!isContentType) return;

      requests.set(details.requestId, {
        ...(requests.get(details.requestId) ?? {}),
        contentType: isContentType,
      });
    } catch (err) {
      console.error(err);
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

/**
 * On Completed checks whether any heuristics were true and, if they were, double-checks whether it's a false positive
 */
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    try {
      const request = requests.get(details.requestId) ?? {};
      const tab = tabs.get(details.tabId) ?? {};
      const isGraphQL = Object.values(request).some((value) => value === true);

      // Delete the per-request result...
      requests.delete(details.requestId);
      // ...and store it per-tab instead
      tabs.set(details.tabId, {
        // If the tab already has true in any keys, keep it there
        // only overwrite potential false results
        body: tab.body || request.body,
        contentType: tab.contentType || request.contentType,
        param: tab.param || request.param,
        isStellate: tab.isStellate || request.isStellate,
      });

      if (!isGraphQL) return;

      const isFalsePositive = await checkKnownFalsePositive(
        details.url,
        details.initiator
      );

      if (isFalsePositive) return;

      chrome.browserAction.setIcon({
        tabId: details.tabId,
        path: "/icons/icon-graphql-yes.png",
      });

      chrome.browserAction.getPopup({ tabId: details.tabId }, (url) => {
        const parsed = new URL(url);
        const params = new URLSearchParams(parsed.search.replace(/^\?/, ""));
        const apis = params.getAll("graphql-api");
        params.set("is-graphql", "true");
        if (tab.isStellate || request.isStellate) {
          params.set("is-stellate", "true");
        }
        params.delete("graphql-api");
        // Only do each unique API once
        [...new Set([...apis, details.url])].forEach((api) => {
          params.append("graphql-api", api);
        });
        chrome.browserAction.setPopup({
          tabId: details.tabId,
          popup: "popup.html?" + params.toString(),
        });
      });
    } catch (err) {
      console.error(err);
    }
  },
  { urls: ["<all_urls>"] }
);

/**
 * Detect application/graphql GraphQL usage
 */
function isGraphQLContentType(
  details: chrome.webRequest.WebRequestHeadersDetails
) {
  try {
    const contentType =
      details.requestHeaders.find(
        ({ name }) => name.toLowerCase() === `content-type`
      )?.value ?? "";

    return contentType.indexOf(`graphql`) > -1;
  } catch (err) {
    return false;
  }
}

/**
 * Detect ?query={me{id}}-style GraphQL usage
 */
function isGraphQLQueryParam(details: chrome.webRequest.WebRequestDetails) {
  try {
    const params = new URL(details.url).searchParams;
    const query = params.get("query") ?? "";
    const extensions = params.get("extensions") ?? "";
    return (
      // TODO: Just "{" might have too many false-positives?
      query.indexOf(`{`) === 0 ||
      query.indexOf(`query`) === 0 ||
      query.indexOf(`mutation`) === 0 ||
      extensions.indexOf(`persistedQuery`) > -1
    );
  } catch (err) {
    return false;
  }
}

/**
 * Detect JSON POST GraphQL usage
 */
function isJSONGraphQLBody(details: chrome.webRequest.WebRequestBodyDetails) {
  try {
    if (!details.requestBody?.raw?.[0]?.bytes) return false;

    const body = enc
      .decode(details.requestBody.raw[0].bytes)
      .replace(/\s/g, "");

    if (typeof body !== "string") return;

    return (
      body.includes('"query":"{') ||
      body.includes('"query":"query') ||
      body.includes('"query":"mutation') ||
      body.includes(`"persistedQuery"`)
    );
  } catch (err) {
    return false;
  }
}

// tabId: The ID of the tab in which the request takes place.
// Set to -1 if the request isn't related to a tab.
const NO_TAB = -1;

/**
 * To avoid tracking embeds/iframes/other third-party scripts on a page we make sure the page itself sent the request
 */
function checkFirstPartyRequest(
  details: chrome.webRequest.WebRequestDetails
): Promise<boolean> {
  try {
    return new Promise((res) => {
      if (details.tabId === NO_TAB) return res(false);

      chrome.tabs.get(details.tabId, (tab) => {
        if (!tab.url) return res(false);

        const initiator = psl.parse(new URL(details.initiator).hostname);
        const url = psl.parse(new URL(tab.url).hostname);
        // @ts-ignore the TS types for the psl module are incorrect, .domain does exist.
        res(initiator.domain === url.domain);
      });
    });
  } catch (err) {
    return Promise.resolve(false);
  }
}

/**
 * Check the "known false positive" list to ensure the website is actually using GraphQL
 */
function checkKnownFalsePositive(
  requestUrl: string,
  initiatorUrl?: string
): Promise<boolean> {
  // Check the false positive db
  let isGraphQLAPIUrl = new URL(`https://is-this-graphql.recc.workers.dev`);

  if (initiatorUrl)
    isGraphQLAPIUrl.searchParams.set(`i`, new URL(initiatorUrl).hostname);

  isGraphQLAPIUrl.searchParams.set(
    `r`,
    new URL(requestUrl).hostname + new URL(requestUrl).pathname
  );

  return fetch(isGraphQLAPIUrl.toString())
    .then((res) => res.json())
    .then((data) => {
      // Known false positive!
      if (data === false) return true;

      return false;
    })
    .catch((err) => {
      return false;
    });
}
