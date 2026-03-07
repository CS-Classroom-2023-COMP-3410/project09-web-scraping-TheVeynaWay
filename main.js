const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

axios.get('https://bulletin.du.edu/undergraduate/coursedescriptions/comp/').then(async response => {
    const $ = cheerio.load(response.data);
    const courses = [];

    $('.courseblocktitle').each((i, el) => {
        const text = $(el).text().trim();

        const beforeCredits = text.split('(')[0].trim();
        const parts = beforeCredits.split(/\s+/);

        const number = parseInt(parts[1]);
        if (number < 3000) return;

        const title = parts.slice(2).join(' ').trim();

        const desc = $(el).next('.courseblockdesc').text();
        if (desc.includes('Prerequisite')) return;

        courses.push({
            course: `COMP-${number}`,
            title: title
        });
    });

    await fs.ensureDir('results');
    await fs.writeJson('results/bulletin.json', { courses }, { spaces: 4 });
});

axios.get('https://denverpioneers.com/services/responsive-calendar.ashx?type=month&sport=0&location=all&date=3%2F6%2F2026+12%3A00%3A00+AM').then(response => {
    const data = response.data;
    const events = [];

    data.forEach(day => {
        if (Array.isArray(day.events)) {
            day.events.forEach(game => {

                const duTeam = game.sport.title;
                const opponent = game.opponent.title;
                const date = game.date.split("T")[0];

                events.push({ duTeam, opponent, date });
            });
        }
    });

    fs.writeFileSync("results/athletic_events.json", JSON.stringify({ events }, null, 4));
    console.log("Scraping complete!");
});

axios.get('https://www.du.edu/calendar').then(response => {
    const $ = cheerio.load(response.data);
    const events = [];

    $("a.event-card").each((i, el) => {

        const title = $(el).find("h3").text().trim();
        const date = $(el).find("p").first().text().trim();

        const timeText = $(el).find("span.icon-du-clock").parent().text().trim();

        let event = { title: title, date: date };

        if (timeText) {
            event.time = timeText;
        }

        events.push(event);
    });

    fs.writeFileSync("results/calendar_events.json", JSON.stringify({ events: events }, null, 4));
});