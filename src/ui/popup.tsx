import * as React from "react";
import * as ReactDOM from "react-dom";

import "../styles/font.css";
import "../styles/popup.css";

function Hello() {
  const params = new URLSearchParams(window.location.search.replace(/^\?/, ""));
  const isGraphQL = params.get("is-graphql") === "true";
  const isStellate = params.get("is-stellate") === "true";
  const apis = params.getAll("graphql-api");

  return (
    <div
      className={`popup ${isGraphQL ? "popup-success" : ""} ${
        isStellate ? "popup-stellate" : ""
      }`}
    >
      {isGraphQL ? (
        <>
          <div className="hero">
            {isStellate ? (
              <YesStellateIcon className="hero-icon" />
            ) : (
              <YesGraphQLIcon className="hero-icon" />
            )}
            {isStellate ? (
              <h2>Yes, it’s GraphQL &amp; powered by Stellate</h2>
            ) : (
              <h2>Yes, it’s GraphQL</h2>
            )}
          </div>
          {apis.length > 0 && (
            <div className="apis">
              {apis.map((url) => (
                <a href={url} key={url} target="_blank" className="api">
                  {url}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="hero">
            <NoGraphQLIcon className="hero-icon" />
            <h2>No, it’s not GraphQL (yet)</h2>
          </div>
        </>
      )}
      <div className="subline">
        <p className="made-by">
          <span>Made by</span>
          <a
            target="_blank"
            href="https://stellate.co"
            className="stellate-logo"
          >
            <StellateIcon /> Stellate
          </a>
        </p>
        <a
          onClick={(evt) => {
            evt.preventDefault();
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                chrome.tabs.create({
                  url: `mailto:extension@stellate.co?subject=${encodeURIComponent(
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
          href={`mailto:extension@stellate.co?subject=${encodeURIComponent(
            `False ${isGraphQL ? "positive" : "negative"} for ENTER URL HERE`
          )}&body=${encodeURIComponent(
            `How do you know this website actually ${
              isGraphQL ? "does not" : "does"
            } use GraphQL?`
          )}`}
          target="_blank"
          className="report-link"
        >
          Report incorrect result
        </a>
      </div>
    </div>
  );
}

function NoGraphQLIcon(props) {
  return (
    <svg
      {...props}
      width="80"
      height="80"
      fill="currentColor"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.3"
        fillRule="evenodd"
        d="M3 40C3 19.566 19.566 3 40 3c9.678 0 18.487 3.715 25.08 9.798L12.799 65.08C6.715 58.487 3 49.678 3 40zm11.92 27.202C21.511 73.284 30.321 77 40 77c20.434 0 37-16.566 37-37 0-9.678-3.716-18.488-9.798-25.08L55.514 26.607l.243.14a4.701 4.701 0 011.06-.839 4.682 4.682 0 016.385 1.714 4.682 4.682 0 01-1.713 6.385 4.68 4.68 0 01-1.245.495v12.452a4.68 4.68 0 011.231.492 4.658 4.658 0 011.714 6.385c-1.285 2.236-4.15 2.999-6.385 1.714a4.64 4.64 0 01-1.156-.938l-10.712 6.185a4.676 4.676 0 01-4.436 6.144 4.667 4.667 0 01-4.672-4.672c0-.459.066-.903.19-1.322l-9.408-5.431-11.69 11.69zM40 0C17.909 0 0 17.909 0 40s17.909 40 40 40 40-17.909 40-40S62.091 0 40 0zm-2.865 59.023l-8.899-5.138 1.271-1.27h25.096c.025.102.054.204.086.306l-10.734 6.197a4.659 4.659 0 00-3.455-1.524 4.657 4.657 0 00-3.365 1.429zm10.76-24.797L31.73 50.392h22.869a4.686 4.686 0 011.315-2.28l-8.017-13.886zm9.946 12.781L49.522 32.6l4.365-4.365.773.446a4.665 4.665 0 003.362 5.813v12.466l-.18.048zm-7.707-23.505l-5.155-2.977c.125-.423.193-.871.193-1.335a4.667 4.667 0 00-4.672-4.672 4.667 4.667 0 00-4.672 4.672c0 .461.067.907.191 1.328l-10.781 6.225a4.71 4.71 0 00-1.055-.834c-2.236-1.285-5.1-.522-6.385 1.714-1.285 2.235-.522 5.1 1.713 6.385.4.23.818.393 1.245.496v12.45a4.685 4.685 0 00-1.232.493 4.682 4.682 0 00-.829 7.493l6.607-6.605a4.698 4.698 0 00-.214-.218l14.11-24.439a4.69 4.69 0 002.607 0l2.985 5.168 1.626-1.626-2.686-4.653c.043-.04.085-.082.126-.125l4.652 2.686 1.626-1.626zm-12.861-.932a4.765 4.765 0 01-.134-.133l-10.8 6.236a4.665 4.665 0 01-3.36 5.82V46.96c.06.015.122.031.183.049l14.11-24.44z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function YesGraphQLIcon(props) {
  return (
    <svg
      {...props}
      width="80"
      height="80"
      fill="none"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        opacity="0.5"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      >
        <path d="M40.5-1.19v3.62" />
        <path d="M56.45,1.98 l-1.39,3.35" />
        <path d="M69.98,11.02 l-2.56,2.56" />
        <path d="M79.02,24.55 l-3.35,1.39" />
        <path d="M82.19,40.5h-3.62" />
        <path d="M79.02,56.45 l-3.35-1.39" />
        <path d="M69.98,69.98 l-2.56-2.56" />
        <path d="M56.45,79.02 l-1.39-3.35" />
        <path d="M40.5,82.19v-3.62" />
        <path d="M24.55,79.02 l1.39-3.35" />
        <path d="M11.02,69.98 l2.56-2.56" />
        <path d="M1.98,56.45 l3.35-1.39" />
        <path d="M-1.19,40.5h3.62" />
        <path d="M1.98,24.55 l3.35,1.39" />
        <path d="M11.02,11.02 l2.56,2.56" />
        <path d="M24.55,1.98 l1.39,3.35" />
      </g>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        fill="currentColor"
        d="M56.8,55.55c2.24,1.28,5.1,0.52,6.39-1.71 c1.3-2.24,0.54-5.09-1.71-6.38c-0.39-0.23-0.81-0.39-1.23-0.49V34.5c0.43-0.1,0.85-0.27,1.24-0.5c2.24-1.3,3-4.15,1.71-6.39 c-1.3-2.24-4.15-3-6.39-1.71c-0.4,0.23-0.76,0.52-1.06,0.84l-10.78-6.22c0.13-0.42,0.19-0.87,0.19-1.34c0-2.58-2.09-4.67-4.67-4.67 s-4.67,2.09-4.67,4.67c0,0.46,0.07,0.91,0.19,1.33l-10.78,6.22c-0.3-0.32-0.66-0.6-1.06-0.83c-2.24-1.29-5.1-0.52-6.38,1.71 c-1.29,2.24-0.52,5.1,1.71,6.39c0.4,0.23,0.82,0.39,1.25,0.5v12.45c-0.42,0.1-0.84,0.27-1.23,0.49c-2.24,1.3-3,4.15-1.71,6.38 c1.29,2.24,4.14,3,6.39,1.71c0.4-0.23,0.75-0.51,1.05-0.82l10.78,6.22c-0.12,0.42-0.19,0.86-0.19,1.32c0,2.58,2.09,4.67,4.67,4.67 s4.67-2.1,4.67-4.67c0-0.51-0.08-1.01-0.24-1.47l10.71-6.19C55.97,54.97,56.36,55.29,56.8,55.55z M54.6,52.61 c0.03,0.1,0.05,0.21,0.09,0.31l-10.73,6.2c-0.85-0.94-2.08-1.52-3.45-1.52c-1.32,0-2.52,0.55-3.37,1.43l-10.79-6.23 c0.02-0.06,0.03-0.12,0.05-0.18H54.6z M55.91,48.11c-0.32,0.3-0.59,0.65-0.82,1.05c-0.23,0.4-0.39,0.81-0.49,1.23H26.4 c-0.1-0.42-0.27-0.84-0.49-1.23c-0.23-0.39-0.51-0.74-0.82-1.04L39.2,23.68c0.41,0.12,0.85,0.18,1.3,0.18 c0.45,0,0.89-0.06,1.31-0.18L55.91,48.11z M58.02,46.96c-0.06,0.01-0.12,0.03-0.18,0.05L43.73,22.57c0.04-0.04,0.08-0.08,0.13-0.12 l10.8,6.24c-0.33,1.17-0.21,2.47,0.44,3.61c0.66,1.14,1.73,1.9,2.92,2.2V46.96z M37.14,22.44c0.04,0.05,0.09,0.09,0.13,0.13 L23.16,47.01c-0.06-0.02-0.12-0.03-0.18-0.05V34.49c1.19-0.3,2.26-1.05,2.92-2.2c0.66-1.14,0.78-2.45,0.44-3.62L37.14,22.44z"
      />
    </svg>
  );
}

function YesStellateIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
      fill="none"
      viewBox="0 0 80 80"
    >
      <g clipPath="url(#clip0_401_1242)">
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M30.688 36.984l19.644-15.79-8.015-4.64c-1.637-.92-3.478-.92-5.081 0L20.797 26.07a4.697 4.697 0 00-1.841 1.808l-.137.307 5.935 7.06 5.933 1.739z"
          clipRule="evenodd"
          opacity="0.5"
        ></path>
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M39.192 43.493l-15.211-11.63c-2.183-1.67-2.899-4.33-2.558-6.172l-.613.375a4.696 4.696 0 00-1.842 1.808l-.068.102c-.035.068-.069.102-.069.17-.375.682-.545 1.467-.545 2.286v18.996c0 1.842.92 3.445 2.523 4.365l4.4 2.524 13.983-12.823z"
          clipRule="evenodd"
        ></path>
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M51.778 44.176L26.814 57.273l10.436 6.036c1.603.921 3.444.921 5.081 0l8.22-4.774 8.253-4.741c.818-.511 1.466-1.16 1.91-1.978l-.58-1.364-4.877-5.593-3.479-.683z"
          clipRule="evenodd"
          opacity="0.5"
        ></path>
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M60.722 51.804l.069-.136c.34-.682.51-1.432.51-2.25V33.182c0-1.5-.579-2.762-1.704-3.786-.17-.136-.375-.306-.546-.409L44.897 38.23l6.89 5.935 4.365 3.82c1.842 1.568 2.387 4.058 1.74 6.31l.92-.513c.819-.511 1.467-1.16 1.91-1.978z"
          clipRule="evenodd"
        ></path>
        <g
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.442"
          opacity="0.5"
        >
          <path d="M40 1.667V5M54.669 4.583l-1.277 3.08M67.106 12.893l-2.357 2.357M75.417 25.33l-3.08 1.276M78.333 40H75M75.417 54.67l-3.08-1.277M67.106 67.107l-2.357-2.357M54.669 75.416l-1.277-3.08M40 78.333V75M25.33 75.416l1.276-3.08M12.895 67.107l2.356-2.357M4.583 54.67l3.08-1.277M1.667 40H5M4.583 25.33l3.08 1.276M12.895 12.893l2.356 2.357M25.33 4.583l1.276 3.08"></path>
        </g>
      </g>
      <defs>
        <clipPath id="clip0_401_1242">
          <path fill="#fff" d="M0 0H80V80H0z"></path>
        </clipPath>
      </defs>
    </svg>
  );
}

function StellateIcon(props) {
  return (
    <svg
      {...props}
      width="22"
      height="24"
      fill="currentColor"
      viewBox="0 0 22 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.6"
        d="M6.2,10.53l9.82-7.87l-4.01-2.31c-0.82-0.46-1.74-0.46-2.54,0L1.25,5.09c-0.39,0.21-0.7,0.52-0.92,0.9 L0.27,6.14l2.97,3.52L6.2,10.53L6.2,10.53z"
      />
      <path d="M10.45,13.78l-7.6-5.8C1.76,7.14,1.4,5.82,1.57,4.9L1.26,5.09c-0.39,0.21-0.7,0.52-0.92,0.9L0.31,6.04 C0.29,6.07,0.27,6.09,0.27,6.12C0.09,6.46,0,6.86,0,7.26v9.47c0,0.92,0.46,1.72,1.26,2.18l2.2,1.26L10.45,13.78L10.45,13.78z" />
      <path
        opacity="0.6"
        d="M16.74,14.12L4.26,20.65l5.22,3.01c0.8,0.46,1.72,0.46,2.54,0l4.11-2.38l4.12-2.36 c0.41-0.25,0.73-0.58,0.95-0.99l-0.29-0.68l-2.44-2.79L16.74,14.12L16.74,14.12z"
      />
      <path d="M21.21,17.92l0.03-0.07c0.17-0.34,0.26-0.71,0.26-1.12V8.64c0-0.75-0.29-1.38-0.85-1.89 c-0.09-0.07-0.19-0.15-0.27-0.2l-7.07,4.61l3.44,2.96l2.18,1.9c0.92,0.78,1.19,2.02,0.87,3.15l0.46-0.26 C20.66,18.65,20.99,18.33,21.21,17.92L21.21,17.92z" />
    </svg>
  );
}

// --------------

ReactDOM.render(<Hello />, document.getElementById("root"));
