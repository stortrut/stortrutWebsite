function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.head.appendChild(script);
  });
}

(async () => {
  try {
    await loadScript('/scripts/scripts-for-all/sidebar-maker.js');

    // Call the function
    if (typeof createSidebar === 'function') createSidebar();
  } catch (err) {
    console.error(err);
  }
})();