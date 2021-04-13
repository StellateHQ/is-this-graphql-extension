import * as psl from "psl";

const enc = new TextDecoder("utf-8");

type Heuristics = {
  body?: boolean;
  param?: boolean;
  contentType?: boolean;
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
  (details) => {
    try {
      if (!isFirstPartyRequest(details)) return;

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
 * On Send Headers checks for GraphQL-related headers
 */
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    try {
      if (!isFirstPartyRequest(details)) return;

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
  (details) => {
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
      });

      if (!isGraphQL) return;

      // Check the false positive db
      let url = new URL(`https://is-this-graphql.recc.workers.dev`);
      if (details.initiator)
        url.searchParams.set(`i`, new URL(details.initiator).hostname);
      url.searchParams.set(`r`, new URL(details.url).hostname);

      fetch(url.toString())
        .then((res) => res.json())
        .then((data) => {
          // False positive!
          if (data === false) return;

          chrome.browserAction.setPopup({
            tabId: details.tabId,
            popup: "popup.html?is-graphql=true",
          });
          chrome.browserAction.setIcon({
            tabId: details.tabId,
            path: "/icons/graphql-true.png",
          });
        })
        .catch((err) => {
          chrome.browserAction.setPopup({
            tabId: details.tabId,
            popup: "popup.html?is-graphql=true",
          });
          chrome.browserAction.setIcon({
            tabId: details.tabId,
            path: "/icons/graphql-true.png",
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

/**
 * To avoid false positives with embeds/iframes/other third-party scripts on a page we make sure the page itself sent the request
 */
function isFirstPartyRequest(details: chrome.webRequest.WebRequestDetails) {
  try {
    const initiator = psl.parse(new URL(details.initiator).hostname);
    const url = psl.parse(new URL(details.url).hostname);

    // @ts-ignore the TS types for the psl module are incorrect, .domain does exist.
    return initiator.domain === url.domain;
  } catch (err) {
    return false;
  }
}
