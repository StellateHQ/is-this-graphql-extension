import * as React from "react";
import * as ReactDOM from "react-dom";
import useInterval from "@use-it/interval";

import "../styles/popup.css";

function Hello() {
  const [result, setResult] = React.useState<{
    body?: boolean;
    param?: boolean;
    contentType?: boolean;
  }>({});

  // Every second check whether the result the background script has computed has changed
  useInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.runtime.sendMessage(
        { type: "getResult", tabId: tabs[0].id },
        (res) => {
          setResult(res ?? {});
        }
      );
    });
  }, 1000);

  const isGraphQL = Object.values(result).some((value) => value === true);

  return (
    <div className={`popup ${isGraphQL ? "popup-success" : ""}`}>
      {isGraphQL ? (
        <>
          <BadgeCheck style={{ width: `80px` }} />
          <h2>This website uses GraphQL!</h2>
        </>
      ) : (
        <>
          <QuestionMark style={{ width: `80px` }} />
          <h2>No GraphQL detected (so far)</h2>
        </>
      )}
      <a
        onClick={(evt) => {
          evt.preventDefault();
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              chrome.tabs.create({
                url: `mailto:extension@graphcdn.io?subject=${encodeURIComponent(
                  `False ${isGraphQL ? "positive" : "negative"} for ${
                    tabs[0]?.url || "ENTER URL HERE"
                  }`
                )}&body=${encodeURIComponent(
                  `How do you know this website actually ${
                    isGraphQL ? "does not" : "does"
                  } use GraphQL?`
                )}`,
              });
            }
          );
        }}
        // No-JS fallback
        href={`mailto:extension@graphcdn.io?subject=${encodeURIComponent(
          `False ${isGraphQL ? "positive" : "negative"} for ENTER URL HERE`
        )}&body=${encodeURIComponent(
          `How do you know this website actually ${
            isGraphQL ? "does not" : "does"
          } use GraphQL?`
        )}`}
        target="_blank"
        className="report-btn"
      >
        Report incorrect result
      </a>
    </div>
  );
}

function QuestionMark(props) {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BadgeCheck(props) {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// --------------

ReactDOM.render(<Hello />, document.getElementById("root"));
