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
    // Load the other scripts sequentially (or you can do them in parallel with Promise.all)
    await loadScript('/scripts/scripts-for-all/topbar-inserter.js');
    await loadScript('/scripts/scripts-for-all/link-inserter.js');
    await loadScript('/scripts/scripts-for-all/sidebar-maker.js');

    // Now call the functions — they should be defined now
    if (typeof replaceWordsWithLinks === 'function') {
      replaceWordsWithLinks();
    }
    if (typeof createSidebar === 'function') {
      createSidebar();
    }
    if (typeof insertTopBar === 'function') {
      insertTopBar();
    }
  } catch (err) {
    console.error(err);
  }
})();
