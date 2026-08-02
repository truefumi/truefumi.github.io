/* ============================================================
   Shared top navigation — plain pipe-separated text links.
   Edit SITE_NAV_LINKS once here and every page updates.
   Each page includes a <div id="site-nav"></div> and this script
   figures out the right relative path depth automatically.
   ============================================================ */

(function () {
  var SITE_NAV_LINKS = [
    { slug: "about-me", label: "About Me" },
    { slug: "resume", label: "Resume" },
    { slug: "projects", label: "Projects" },
    { slug: "certifications", label: "Certifications" },
    { slug: "resources", label: "Resources" }
  ];

  function renderNav() {
    var mount = document.getElementById("site-nav");
    if (!mount) return;

    var depth = parseInt(mount.dataset.depth || "0", 10);
    var prefix = depth === 0 ? "./" : "../".repeat(depth);
    var currentSlug = mount.dataset.section || "";

    var parts = [];
    parts.push('<a href="' + prefix + 'index.html">Home</a>');
    SITE_NAV_LINKS.forEach(function (link) {
      var activeClass = link.slug === currentSlug ? ' class="active"' : "";
      parts.push(
        '<a' +
          activeClass +
          ' href="' +
          prefix +
          link.slug +
          '/index.html">' +
          link.label +
          "</a>"
      );
    });

    mount.innerHTML = '<p class="site-nav">' + parts.join(" | ") + "</p>";
  }

  document.addEventListener("DOMContentLoaded", renderNav);
})();
