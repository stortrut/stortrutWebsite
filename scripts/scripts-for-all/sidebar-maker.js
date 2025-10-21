function createSidebar() {
    const headings = document.querySelectorAll("h2");
    if (headings.length === 0) return;

    const toc = document.getElementById("toc-sidebar");
    const list = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = "Innehåll";
    toc.appendChild(title);

    headings.forEach((h2, index) => {
        if (!h2.id) h2.id = "section-" + index;

        const link = document.createElement("a");
        link.href = `#${h2.id}`;
        link.textContent = h2.textContent;

        list.appendChild(link);
    });

    // Remove unwanted attributes
    const sidebarLinks = document.querySelectorAll('#sidebar-contents a');
    sidebarLinks.forEach(link => link.removeAttribute('data-preview'));

    console.log(`✅✅✅ Sidebar created!`);

    toc.appendChild(list);
}