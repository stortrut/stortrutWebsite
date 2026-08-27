
fetch('/articles/pages.json')
    .then(response => response.json())
    .then(pages => {

        const sessions = pages.filter(page =>
            page.url.startsWith('/articles/session-reports/campaign_2/')
        );

        //Sort sessions numerically
        sessions.sort((a, b) => {
            const numA = parseInt(a.url.match(/session_(\d+)_C2/i)[1]);
            const numB = parseInt(b.url.match(/session_(\d+)_C2/i)[1]);

            return numA - numB;
        });

        //Generate each button
        sessions.forEach(session => {
            console.log(session.name, session.url);

            const sessionHolder = document.querySelector('.session-holder');

            const button = document.createElement('button');

            let fileName = session.url.split('/').pop().replace('.html', '');
            fileName = fileName.replace('s', 'S'); //Only replaces the first s with a A
            fileName = fileName.replace('C2', '');
            fileName = fileName.replaceAll('_', ' ');

            button.textContent = fileName;
            button.className = 'top-bar-button';

            button.onclick = () => {
                window.location.href = session.url;
            };

            sessionHolder.appendChild(button);
        });
    });