import * as psl from "psl";

const enc = new TextDecoder("utf-8");

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (!isFirstPartyRequest(details)) return;

      const isGraphQL =
        isJSONGraphQLBody(details) || isGraphQLQueryParam(details);
      if (!isGraphQL) return;

      chrome.browserAction.setIcon({
        tabId: details.tabId,
        path: "/icons/graphql-true.png",
      });
    } catch (err) {}
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      const isGraphQL = isGraphQLContentType(details);
      if (!isGraphQL) return;

      chrome.browserAction.setIcon({
        tabId: details.tabId,
        path: "/icons/graphql-true.png",
      });
    } catch (err) {}
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
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
    return (
      // TODO: Just "{" might have too many false-positives?
      query.indexOf(`{`) === 0 ||
      query.indexOf(`query`) === 0 ||
      query.indexOf(`mutation`) === 0
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
      body.includes('"query":"mutation')
    );
  } catch (err) {
    return false;
  }
}

/**
 * To avoid false positives with embeds/iframes/other third-party scripts on a page we make sure the page itself sent the request
 */
function isFirstPartyRequest(details: chrome.webRequest.WebRequestDetails) {
  const initiator = psl.parse(new URL(details.initiator).hostname);
  const url = psl.parse(new URL(details.url).hostname);

  // @ts-ignore the TS types for the psl module are incorrect, .domain does exist.
  return initiator.domain === url.domain;
}
