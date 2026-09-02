{
const script = document.currentScript;
const campaign = script.dataset.campaign;

console.log(campaign);



fetch('/articles/pages.json')
    .then(response => response.json())
    .then(pages => {

        const sessions = pages.filter(page =>
            page.url.startsWith(`/articles/session-reports/campaign_${campaign}/`)
        );

        //Sort sessions numerically
        const sessionRegex = new RegExp(`session_(\\d+)_C${campaign}`, 'i');

        sessions.sort((a, b) => {
            const numA = parseInt(a.url.match(sessionRegex)[1]);
            const numB = parseInt(b.url.match(sessionRegex)[1]);

            return numA - numB;
        });

        //Generate each button
        sessions.forEach(session => {
            console.log(session.name, session.url);

            const sessionHolder = document.querySelector(`.campaign-${campaign}`);            
            
            const button = document.createElement('button');

            let fileName = session.url.split('/').pop().replace('.html', '');

            fileName = fileName.replace('s', 'S');
            fileName = fileName.replace(`C${campaign}`, '');
            fileName = fileName.replaceAll('_', ' ');

            button.textContent = fileName;
            button.className = 'top-bar-button';

            button.onclick = () => {
                window.location.href = session.url;
            };

            sessionHolder.appendChild(button);
        });
    });
}