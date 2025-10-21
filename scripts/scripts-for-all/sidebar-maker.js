function createSidebar() {
    document.addEventListener("DOMContentLoaded", function () {
        const headings = document.querySelectorAll("h2");
        if (headings.length === 0) return;

        const toc = document.getElementById("toc-sidebar");
        const list = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = "Innehåll";
        toc.appendChild(title);

        headings.forEach((h2, index) => {
            // Generate unique ID if missing
            if (!h2.id) {
                h2.id = "section-" + index;
            }

            const link = document.createElement("a");
            link.href = `#${h2.id}`;
            link.textContent = h2.textContent;

            list.appendChild(link);
        });

        // After generating and inserting sidebar links:
        const sidebarLinks = document.querySelectorAll('#sidebar-contents a');
        sidebarLinks.forEach(link => {
            link.removeAttribute('data-preview');
        });

        toc.appendChild(list);
    });
}