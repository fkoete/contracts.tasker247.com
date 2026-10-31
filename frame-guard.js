/* Anti-clickjacking: if this page is loaded inside a frame, hide it and try to break out.
   (Meta tags cannot set frame-ancestors / X-Frame-Options, so this is the best static-hosting option.) */
(function () {
  if (window.top !== window.self) {
    document.documentElement.style.display = "none";
    try { window.top.location = window.self.location; } catch (e) { /* cross-origin: page stays hidden */ }
  }
})();
