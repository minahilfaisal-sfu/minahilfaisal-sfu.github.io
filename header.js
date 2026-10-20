// ===========================================================
// <site-header> — the header shared by every page.
//
// Use it on a page with two lines:
//   in <head>:  <script src="header.js"></script>   (with ../ per folder level)
//   in <body>:  <site-header></site-header>
//
// To add a page to the navigation, add it to NAV_LINKS below —
// every page picks it up. Links are worked out relative to where
// this file lives, so they work from any folder, both on the live
// site and when previewing locally.
// ===========================================================

const NAV_LINKS = [
  { label: "Home", path: "index.html" },
  { label: "Projects", path: "projects/index.html" },
];

// The site's root folder, found from this script's own address
const SITE_ROOT = new URL(".", document.currentScript.src).href;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const links = NAV_LINKS
      .map((link) => `<a href="${SITE_ROOT + link.path}">${link.label}</a>`)
      .join("\n");

    this.innerHTML = `
      <header>
        <a class="site-name" href="${SITE_ROOT}index.html">
          <img src="${SITE_ROOT}favicon.png" alt="" class="site-logo">
          Minahil Faisal
        </a>
        <nav>
          ${links}
        </nav>
      </header>
    `;
  }
}

customElements.define("site-header", SiteHeader);

// Give every page the logo in its browser tab, too
if (!document.querySelector('link[rel="icon"]')) {
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.href = SITE_ROOT + "favicon.png";
  document.head.appendChild(icon);
}
