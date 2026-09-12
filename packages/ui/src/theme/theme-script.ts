// Inlined blocking script — prevents flash of wrong theme on first paint.
// Keep this tiny: it runs synchronously in <head> before any React hydration.
export const themeScript = `
(function(){
  try {
    var stored = document.cookie.match(/mg-theme=([^;]+)/);
    var theme = stored ? stored[1] : null;
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`.trim();
