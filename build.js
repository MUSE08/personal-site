/* Generates data/blog.json and data/projects.json from per-entry files.
   Run before deploy:  node build.js   */
const fs = require('fs');
const path = require('path');

function readJsonDir(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.json')) continue;
        try {
            const raw = fs.readFileSync(path.join(dir, f), 'utf8');
            const obj = JSON.parse(raw);
            out.push(obj);
        } catch (e) {
            console.error('skip', f, e.message);
        }
    }
    return out;
}

const blogPosts = readJsonDir(path.join(__dirname, 'content', 'blog'));
const projects = readJsonDir(path.join(__dirname, 'content', 'projects'));

const order = ['LiveGrab', 'LinkSkip', 'Planify', 'PyAcademy', 'PersonalSite'];
projects.sort((a, b) => {
    const ia = order.indexOf(a.name);
    const ib = order.indexOf(b.name);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
});
blogPosts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''), 'fa'));

const placeholder = {
    name: 'coming',
    lang: 'soon',
    title_fa: 'پروژه بعدی...',
    title_en: 'Next Project...',
    desc_fa: 'به زودی اینجا با یک پروژه جدید پر می‌شود.',
    desc_en: 'Coming soon — will be filled with a new project.',
    tags: []
};

fs.writeFileSync(
    path.join(__dirname, 'data', 'blog.json'),
    JSON.stringify({ posts: blogPosts }, null, 2) + '\n'
);
fs.writeFileSync(
    path.join(__dirname, 'data', 'projects.json'),
    JSON.stringify({ projects, placeholder }, null, 2) + '\n'
);

console.log(`build ok: ${blogPosts.length} posts, ${projects.length} projects`);
