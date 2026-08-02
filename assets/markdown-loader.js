/* ============================================================
   Generic markdown-section engine.
   Each section's index.html defines:
     window.SECTION_TITLE   -> string
     window.SECTION_INTRO   -> string (subtitle, optional)
   ...then calls initSectionPage() once the DOM is ready.

   The list of nested pages is no longer hardcoded here — it's read
   from pages/manifest.json, which a GitHub Action regenerates from
   whatever .md files actually exist in pages/. Add a new .md file,
   push, and it shows up automatically.

   Nested pages are addressed with ?page=<slug> so they're
   bookmarkable / linkable, e.g. resume/index.html?page=education
   ============================================================ */

function initSectionPage() {
  var pages = [];
  var contentEl = document.getElementById("content");
  var navEl = document.getElementById("page-nav-list");
  var titleEl = document.getElementById("page-title");
  var introEl = document.getElementById("page-intro");

  if (titleEl) titleEl.textContent = window.SECTION_TITLE || "";
  if (introEl) introEl.textContent = window.SECTION_INTRO || "";

  function getRequestedSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get("page") || (pages[0] && pages[0].slug);
  }

  function renderSidebar(activeSlug) {
    if (!navEl) return;
    navEl.innerHTML = "";
    pages.forEach(function (page) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.textContent = page.title;
      a.href = "?page=" + encodeURIComponent(page.slug);
      if (page.slug === activeSlug) a.classList.add("active");
      a.addEventListener("click", function (evt) {
        evt.preventDefault();
        loadPage(page.slug, true);
      });
      li.appendChild(a);
      navEl.appendChild(li);
    });
  }

  function loadPage(slug, pushState) {
    var page = pages.filter(function (p) {
      return p.slug === slug;
    })[0];

    if (!page) {
      contentEl.innerHTML = '<p class="error">Page not found.</p>';
      return;
    }

    contentEl.innerHTML = '<p class="loading">Loading&hellip;</p>';

    fetch(page.file)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (markdown) {
        contentEl.innerHTML = marked.parse(markdown);
        document.title = page.title + " · " + (window.SECTION_TITLE || "");
      })
      .catch(function (err) {
        contentEl.innerHTML =
          '<p class="error">Could not load "' +
          page.file +
          '".</p>';
        console.error(err);
      });

    renderSidebar(slug);

    if (pushState) {
      var url = "?page=" + encodeURIComponent(slug);
      window.history.pushState({ slug: slug }, "", url);
    }
  }

  window.addEventListener("popstate", function () {
    loadPage(getRequestedSlug(), false);
  });

  fetch("pages/manifest.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (manifest) {
      pages = manifest;
      if (pages.length === 0) {
        contentEl.innerHTML =
          '<p class="error">No pages yet — add a .md file to this section\'s pages/ folder.</p>';
        return;
      }
      loadPage(getRequestedSlug(), false);
    })
    .catch(function (err) {
      contentEl.innerHTML =
        '<p class="error">Could not load pages/manifest.json. If you just added this section, ' +
        "run <code>node .github/scripts/generate-manifests.js</code> locally, or push to let the " +
        "GitHub Action generate it.</p>";
      console.error(err);
    });
}

