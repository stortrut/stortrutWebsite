// Supported formats:
//
// @Jon
// @Jon Smith
// Jon@(Target)
// (Display Name)@(Target)
// Jon@Target
//
// Examples:
//
// @Hektor
// @Hektor Kostos
// Hektor@(Hektor Kostos)
// (Hektor)@(Hektor Kostos)
// Hektor@Kostos


function replaceWordsWithLinks(rootNode = document.body) {

    // ==========================================================
    // Load pages database
    // ==========================================================

    fetch('/articles/pages.json')
        .then(res => res.json())
        .then(pages => {

            // ==========================================================
            // Build lookup maps
            // ==========================================================

            const nameMap = {};
            const shorthandMap = {};

            for (const page of pages) {

                if (page.name) {

                    const name =
                        page.name.trim().toLowerCase();

                    nameMap[name] = page.url;
                }

                if (Array.isArray(page.shorthands)) {

                    for (const sh of page.shorthands) {

                        if (sh) {

                            const shorthand =
                                sh.trim().toLowerCase();

                            shorthandMap[shorthand] =
                                page.url;
                        }
                    }
                }
            }


            // ==========================================================
            // Normalize target
            // ==========================================================

            function normalizeTarget(target) {

                return target
                    .trim()
                    .toLowerCase()
                    .replace(/[.,!?;:]+$/, '');
            }


            // ==========================================================
            // Find URL using full name
            // ==========================================================

            function findFullNameUrl(target) {

                if (!target) {
                    return null;
                }

                target =
                    normalizeTarget(target);

                let url =
                    nameMap[target];

                if (url) {
                    return url;
                }

                // Swedish plural -s
                if (target.endsWith('s')) {

                    const singular =
                        target.slice(0, -1);

                    url =
                        nameMap[singular];

                    if (url) {
                        return url;
                    }
                }

                return null;
            }


            // ==========================================================
            // Find URL using full name OR shorthand
            // ==========================================================

            function findPageUrl(target) {

                if (!target) {
                    return null;
                }

                target =
                    normalizeTarget(target);

                // Full name first
                let url =
                    nameMap[target];

                if (url) {
                    return url;
                }

                // Swedish plural -s
                if (target.endsWith('s')) {

                    const singular =
                        target.slice(0, -1);

                    url =
                        nameMap[singular];

                    if (url) {
                        return url;
                    }
                }

                // Shorthand
                url =
                    shorthandMap[target];

                if (url) {
                    return url;
                }

                return null;
            }


            // ==========================================================
            // Escape HTML
            // ==========================================================

            function escapeHtml(value) {

                return value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }


            // ==========================================================
            // Escape regex characters
            // ==========================================================

            function escapeRegex(value) {

                return value.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );
            }


            // ==========================================================
            // Get full names, longest first
            // ==========================================================

            const fullNames =
                Object.keys(nameMap)
                    .filter(name => name.includes(' '))
                    .sort((a, b) => b.length - a.length);


            let fullNamePattern = '';

            if (fullNames.length > 0) {

                fullNamePattern =
                    fullNames
                        .map(escapeRegex)
                        .join('|');
            }


            // ==========================================================
            // Process text nodes
            // ==========================================================

            const walker =
                document.createTreeWalker(
                    rootNode,
                    NodeFilter.SHOW_TEXT
                );

            const nodes = [];

            while (walker.nextNode()) {
                nodes.push(walker.currentNode);
            }


            nodes.forEach(node => {

                const text =
                    node.textContent;

                if (!text.includes('@')) {
                    return;
                }


                let result = text;


                // ======================================================
                // (Display Name)@(Target)
                // ======================================================

                result = result.replace(
                    /\(([^()\n]+)\)@\(([^()\n]+)\)/gu,
                    (match, display, target) => {

                        const url =
                            findPageUrl(target);

                        if (!url) {
                            return match;
                        }

                        return (
                            `<a href="${escapeHtml(url)}">` +
                            `${escapeHtml(display)}` +
                            `</a>`
                        );
                    }
                );


                // ======================================================
                // Name@(Target)
                // ======================================================

                result = result.replace(
                    /([\p{L}\p{N}_-]+)@\(([^()\n]+)\)/gu,
                    (match, display, target) => {

                        const url =
                            findPageUrl(target);

                        if (!url) {
                            return match;
                        }

                        return (
                            `<a href="${escapeHtml(url)}">` +
                            `${escapeHtml(display)}` +
                            `</a>`
                        );
                    }
                );


                // ======================================================
                // Name@Target
                // ======================================================

                result = result.replace(
                    /([\p{L}\p{N}_-]+)@([\p{L}\p{N}_-]+)/gu,
                    (match, display, target) => {

                        const url =
                            findPageUrl(target);

                        if (!url) {
                            return match;
                        }

                        return (
                            `<a href="${escapeHtml(url)}">` +
                            `${escapeHtml(display)}` +
                            `</a>`
                        );
                    }
                );


                // ======================================================
                // @Full Name OR @Shorthand
                //
                // IMPORTANT:
                //
                // These are handled in ONE pass.
                //
                // That means after @Odo Orgulas becomes a link,
                // another regex cannot subsequently see the @Odo
                // inside the generated HTML.
                // ======================================================

                let mentionRegex;

                if (fullNamePattern) {

                    mentionRegex =
                        new RegExp(
                            `@(${fullNamePattern}|[\\p{L}\\p{N}_-]+)(?=\\s|[.,!?;:]|$)`,
                            'giu'
                        );

                } else {

                    mentionRegex =
                        /@([\p{L}\p{N}_-]+)(?=\s|[.,!?;:]|$)/gu;
                }


                result =
                    result.replace(
                        mentionRegex,
                        (match, target) => {

                            const url =
                                findPageUrl(target);

                            if (!url) {
                                return match;
                            }

                            return (
                                `<a href="${escapeHtml(url)}">` +
                                `${escapeHtml(target)}` +
                                `</a>`
                            );
                        }
                    );


                // ======================================================
                // Replace text node
                // ======================================================

                if (result !== text) {

                    const span =
                        document.createElement('span');

                    span.innerHTML =
                        result;

                    node.parentNode.replaceChild(
                        span,
                        node
                    );
                }

            });


            // ==========================================================
            // Tooltip system
            // ==========================================================

            function showTooltip(link, preview) {

                let tooltip =
                    document.getElementById(
                        'link-preview-tooltip'
                    );


                if (!tooltip) {

                    tooltip =
                        document.createElement('div');

                    tooltip.id =
                        'link-preview-tooltip';

                    tooltip.style.position =
                        'absolute';

                    tooltip.style.padding =
                        '8px 12px';

                    tooltip.style.background =
                        'rgba(0,0,0,0.94)';

                    tooltip.style.color =
                        '#fff';

                    tooltip.style.borderRadius =
                        '4px';

                    tooltip.style.pointerEvents =
                        'none';

                    tooltip.style.transition =
                        'opacity 0.2s ease';

                    tooltip.style.opacity =
                        '0';

                    tooltip.style.maxWidth =
                        '300px';

                    tooltip.style.whiteSpace =
                        'normal';

                    tooltip.style.zIndex =
                        '9999';

                    document.body.appendChild(
                        tooltip
                    );
                }


                tooltip.textContent =
                    preview;


                const rect =
                    link.getBoundingClientRect();


                let left =
                    rect.left +
                    window.scrollX;


                let top =
                    rect.bottom +
                    window.scrollY +
                    8;


                const padding = 10;
                const tooltipWidth = 300;


                const viewportWidth =
                    document.documentElement.clientWidth;


                if (
                    left +
                    tooltipWidth +
                    padding >
                    viewportWidth
                ) {

                    left =
                        viewportWidth -
                        tooltipWidth -
                        padding;
                }


                if (left < padding) {
                    left = padding;
                }


                tooltip.style.left =
                    `${left}px`;

                tooltip.style.top =
                    `${top}px`;

                tooltip.style.opacity =
                    '1';
            }


            function hideTooltip() {

                const tooltip =
                    document.getElementById(
                        'link-preview-tooltip'
                    );

                if (tooltip) {
                    tooltip.style.opacity =
                        '0';
                }
            }


            // ==========================================================
            // Tooltip handlers
            // ==========================================================

            document
                .querySelectorAll('a')
                .forEach(link => {

                    // Don't add tooltips to TOC
                    if (
                        link.closest('#toc-sidebar')
                    ) {
                        return;
                    }


                    link.addEventListener(
                        'mouseenter',
                        async () => {

                            if (!link.dataset.preview) {

                                try {

                                    const res =
                                        await fetch(
                                            link.href
                                        );

                                    const html =
                                        await res.text();

                                    const parser =
                                        new DOMParser();

                                    const doc =
                                        parser.parseFromString(
                                            html,
                                            'text/html'
                                        );


                                    const metaDesc =
                                        doc.querySelector(
                                            'meta[name="description"]'
                                        );


                                    const preview =
                                        metaDesc
                                            ? metaDesc.getAttribute(
                                                'content'
                                            )
                                            : 'No preview available';


                                    link.dataset.preview =
                                        preview;

                                } catch {

                                    link.dataset.preview =
                                        'Failed to load preview';
                                }
                            }


                            showTooltip(
                                link,
                                link.dataset.preview
                            );
                        }
                    );


                    link.addEventListener(
                        'mouseleave',
                        hideTooltip
                    );

                });

        })
        .catch(err => {

            console.error(
                'Error loading pages.json',
                err
            );

        });
}


// ==========================================================
// Template processing
// ==========================================================

function processEventDataTemplate() {

    const template =
        document.getElementById('eventData');

    if (!template) {
        return;
    }


    const fragment =
        template.content.cloneNode(true);


    replaceWordsWithLinks(fragment);


    const timeline =
        document.getElementById('timeline');


    if (timeline) {
        timeline.appendChild(fragment);
    }
}


// ==========================================================
// Optional automatic processing
// ==========================================================

// window.addEventListener('DOMContentLoaded', () => {
//     processEventDataTemplate();
// });