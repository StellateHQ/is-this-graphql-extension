import * as psl from "psl";

const enc = new TextDecoder("utf-8");

type RequestMeta = {
  body?: boolean;
  param?: boolean;
  contentType?: boolean;
  startTime?: Date;
};
const requests = new Map<string, RequestMeta>();

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
    } catch (err) {}
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
        startTime: new Date(details.timeStamp),
      });
    } catch (err) {}
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

/**
 * On Completed checks whether any heuristics were true
 */
chrome.webRequest.onCompleted.addListener(
  (details) => {
    try {
      const request = requests.get(details.requestId);
      if (!request) return;

      if (Object.values(request).some((value) => value === true)) {
        chrome.browserAction.setIcon({
          tabId: details.tabId,
          path: "/icons/graphql-true.png",
        });
      }

      requests.delete(details.requestId);
    } catch (err) {}
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
  const initiator = psl.parse(new URL(details.initiator).hostname);
  const url = psl.parse(new URL(details.url).hostname);

  // @ts-ignore the TS types for the psl module are incorrect, .domain does exist.
  return initiator.domain === url.domain;
}
