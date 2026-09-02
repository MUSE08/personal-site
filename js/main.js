/* =====================================================
   v6 — IDE Dark Neon · main script
   ===================================================== */
(function () {
    'use strict';

    const root = document.documentElement;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- THEME ---------- */
    (function () {
        const toggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        let t = (() => { try { return localStorage.getItem('theme'); } catch(e){ return null; } })();
        if (!t) t = window.matchMedia?.('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';

        function apply(theme) {
            if (theme === 'light') root.setAttribute('data-theme', 'light');
            else root.setAttribute('data-theme', 'dark');
            try { localStorage.setItem('theme', theme); } catch(e){}
        }

        apply(t);

        toggle?.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            apply(isDark ? 'light' : 'dark');
        });
    })();

    /* ---------- NAV ---------- */
    (function () {
        const toggle = document.getElementById('nav-toggle');
        const menu = document.getElementById('nav-menu');
        toggle?.addEventListener('click', () => { menu?.classList.toggle('open'); toggle.classList.toggle('open'); });
        document.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', () => { menu?.classList.remove('open'); toggle?.classList.remove('open'); }));

        const header = document.getElementById('header');
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav__link');
        const secDots = document.querySelectorAll('.sec-nav__dot');

        // Use IntersectionObserver for robust section tracking
        const observe = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const id = e.target.id;
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
                secDots.forEach(d => d.classList.toggle('active', d.getAttribute('data-section') === id));
            });
        }, { threshold: .5, rootMargin: '0px' });
        sections.forEach(s => observe.observe(s));

        function onScroll() {
            header?.classList.toggle('scrolled', scrollY > 20);
            document.body.classList.toggle('scrolled', scrollY > 80);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    })();

    /* ---------- PROGRESS BAR ---------- */
    (function () {
        const bar = document.getElementById('progress');
        function update() {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
            if (bar) bar.style.width = p + '%';
        }
        window.addEventListener('scroll', update, { passive: true });
        update();
    })();

    /* ---------- PARTICLES (subtle) ---------- */
    (function () {
        const canvas = document.getElementById('particles');
        if (!canvas || isReduced) return;
        const ctx = canvas.getContext('2d');
        let W, H, pts = [];
        let mx = -999, my = -999;

        function resize() {
            W = window.innerWidth; H = window.innerHeight;
            canvas.width = W; canvas.height = H;
            init();
        }
        function init() {
            // higher density
            const count = Math.min(140, Math.floor((W * H) / 12000));
            pts = Array.from({ length: count }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - .5) * .3,
                vy: (Math.random() - .5) * .3,
                r: Math.random() * 1.8 + .3,
                tw: Math.random() * Math.PI * 2,
                sp: Math.random() * .02 + .006,
                isStar: Math.random() > .35
            }));
            // figure-8 constellation: 8 fixed stars
            const R = Math.min(W, H) * .3;
            for (let i = 0; i < 8; i++) {
                const t = (i / 8) * Math.PI * 2;
                pts.push({
                    x: W / 2 + Math.cos(t) * R,
                    y: H / 2 + Math.sin(2 * t) * R * .5,
                    vx: 0, vy: 0,
                    r: 2.2 + Math.sin(i) * .4,
                    tw: i * .8,
                    sp: .008,
                    isStar: true,
                    fixed: true
                });
            }
        }
        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        document.addEventListener('mouseleave', () => { mx = -999; my = -999; });

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const REPEL = 90;
            pts.forEach(p => {
                // repel from mouse so stars flee it (but not the fixed 8-constellation stars)
                const dx = p.x - mx, dy = p.y - my;
                const dist = Math.hypot(dx, dy);
                if (!p.fixed && dist < REPEL && dist > 0.01) {
                    const force = (1 - dist / REPEL) * 1.4;
                    p.vx += (dx / dist) * force * .6;
                    p.vy += (dy / dist) * force * .6;
                }
                // gentle damping so it doesn't run away forever
                p.vx *= .96; p.vy *= .96;
                p.x += p.vx; p.y += p.vy;
                if (p.fixed) { p.x = p.x; p.y = p.y; } // keep fixed stars in place
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;

                p.tw += p.sp;
                const twinkle = p.isStar ? .2 + (Math.sin(p.tw) + 1) / 2 * .5 : .3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.isStar ? `rgba(230,241,255,${twinkle})` : `rgba(34,211,238,${twinkle})`;
                ctx.fill();

                // faint glow on bigger stars
                if (p.r > 1.1) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(34,211,238,${twinkle * .06})`;
                    ctx.fill();
                }
            });
            requestAnimationFrame(draw);
        }
        resize();
        requestAnimationFrame(draw);
        window.addEventListener('resize', resize);
    })();

    /* ---------- TIMECODE (24fps, cinema) ---------- */
    (function () {
        const el = document.getElementById('timecode');
        if (!el) return;
        let frames = 0;
        const pad = n => String(n).padStart(2, '0');
        setInterval(() => {
            frames++; if (frames >= 24) frames = 0;
            const d = new Date();
            el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(frames)}`;
        }, 1000 / 24);
    })();

    /* ---------- BUILD LOG (typing animation, show-don't-tell) ---------- */
    (function () {
        const log = document.getElementById('build-log');
        if (!log || isReduced) return;
        const cursor = document.getElementById('build-cursor');
        const lines = Array.from(log.querySelectorAll('.about__line'));

        // hide all lines initially
        lines.forEach(l => l.style.display = 'none');

        let li = 0;
        function typeLine() {
            if (li >= lines.length) {
                if (cursor) cursor.style.display = 'inline';
                startClock();
                return;
            }
            const line = lines[li];
            line.style.display = 'block';

            // lines with special HTML (inf symbol) are revealed whole, not typed char-by-char
            if (line.querySelector('.about__inf-sym') || line.id === 'build-time') {
                li++;
                setTimeout(typeLine, 300);
                return;
            }

            const full = line.textContent;
            line.textContent = '';
            let ci = 0;
            const interval = setInterval(() => {
                ci++;
                line.textContent = full.substring(0, ci);
                if (ci >= full.length) {
                    clearInterval(interval);
                    li++;
                    setTimeout(typeLine, 240);
                }
            }, 22);
        }

        // live timestamp in build log
        function startClock() {
            const ts = document.getElementById('build-timestamp');
            if (!ts) return;
            const pad = n => String(n).padStart(2, '0');
            function tick() {
                const d = new Date();
                ts.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
            }
            tick();
            setInterval(tick, 1000);
        }

        // start when about section becomes visible
        const aboutSec = document.getElementById('about');
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    setTimeout(typeLine, 400);
                    io.disconnect();
                }
            });
        }, { threshold: .25 });
        io.observe(aboutSec);
    })();

    /* ---------- NAV LOGO TYPING LOOP (علی واهب ↔ Ali Vaheb) ---------- */
    (function () {
        const el = document.getElementById('nav-logo-type');
        if (!el) return;
        const words = ['علی واهب', 'Ali Vaheb'];
        let wi = 0, ci = 0, deleting = false;

        function tick() {
            const w = words[wi];
            el.textContent = w.substring(0, ci);
            if (!deleting) {
                ci++;
                if (ci > w.length) { deleting = true; setTimeout(tick, 1800); return; }
                setTimeout(tick, 90);
            } else {
                ci--;
                if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
                setTimeout(tick, 45);
            }
        }
        setTimeout(tick, 1000);
    })();

    /* ---------- I18N (EN/FA toggle) ---------- */
    (function () {
        const btn = document.getElementById('lang-toggle');
        const root = document.documentElement;
        const dict = {
            'nav-home':     {fa:'خانه',          en:'Home'},
            'nav-about':    {fa:'درباره',        en:'About'},
            'nav-skills':   {fa:'مهارت‌ها',      en:'Stack'},
            'nav-projects': {fa:'پروژه‌ها',      en:'Works'},
            'nav-blog':     {fa:'بلاگ',          en:'Blog'},
            'nav-signal':   {fa:'سیگنال',        en:'Signal'},
            'nav-contact':  {fa:'تماس',          en:'Contact'},
            'hero-cta1':    {fa:'مشاهده پروژه‌ها', en:'View Projects'},
            'hero-cta2':    {fa:'تماس',          en:'Contact'},
            'blog-sub':     {fa:'قاب‌هایی از فکر، کتاب و فیلم', en:'Frames of thought, books & film'},
            'signal-sub':   {fa:'پیامت مستقیم به ایمیل علی می‌رسد', en:'Your message goes straight to my inbox'},
            'contact-sub':  {fa:'کانال‌های ارتباطی', en:'Communication channels'},
            'proj-livegrab':{fa:'LiveGrab — اپلیکیشن دسکتاپ', en:'LiveGrab — Desktop Application'},
            'proj-livegrab-d':{fa:'اپلیکیشن WPF با WebView2، بلاک تبلیغات و پشتیبانی کامل از RTL.', en:'WPF desktop app with WebView2, ad blocking, full RTL support.'},
            'proj-linkskip':{fa:'LinkSkip — دور زدن لینک‌های تبلیغاتی', en:'LinkSkip — Ad Shortener Bypasser'},
            'proj-linkskip-d':{fa:'ابزار روی Cloudflare Workers که لینک‌های کوتاه تبلیغاتی را دور می‌زند.', en:'Cloudflare Worker tool that bypasses ad-shortener links with a public API.'},
            'proj-planify':{fa:'برنامه‌ریز هوشمند هفتگی', en:'Smart Weekly Planner'},
            'proj-planify-d':{fa:'ابزار برنامه‌ریزی هفتگی و ماهانه با رابط کاربری تمیز و مینیمال.', en:'Weekly & monthly planning tool with a clean, minimal UI.'},
            'proj-pyacademy':{fa:'آکادمی پایتون — از صفر تا داده', en:'Python Academy — Zero to Data'},
            'proj-pyacademy-d':{fa:'دوره آموزشی گام‌به‌گام پایتون؛ نسخه ۱ از مفاهیم پایه، نسخه ۲ مسیر حرفه‌ای داده.', en:'Step-by-step Python course; v1 for basics, v2 for data & ML.'},
            'proj-personal':{fa:'طراحی سایت شخصی — نمونه دمو', en:'Personal Site Design — Demo'},
            'proj-personal-d':{fa:'یک سایت شخصی ساخته‌شده با Astro — این یک نمونه دمو است.', en:'A personal site built with Astro — this is a demo sample.'},
            'proj-coming':{fa:'پروژه بعدی...', en:'Next Project...'},
            'proj-coming-d':{fa:'به زودی اینجا با یک پروژه جدید پر می‌شود.', en:'Coming soon — will be filled with a new project.'},
            'blog-book':{fa:'آخرین کتابی که خواندم', en:'The Last Book I Read'},
            'blog-book-e':{fa:'یادداشت کوتاهی درباره کتابی که این روزها در دست دارم...', en:'A short note about the book I\'m currently reading...'},
            'blog-film':{fa:'قابی از فیلم', en:'A Frame from a Film'},
            'blog-film-e':{fa:'یک سکانس، یک فکر؛ نگاهی به صحنه‌ای که نتوانستم فراموشش کنم...', en:'A scene, a thought; looking at a shot I couldn\'t forget...'},
            'blog-thought':{fa:'یه فکر ساده', en:'A Simple Thought'},
            'blog-thought-e':{fa:'گاه‌وقت یک سؤال ساده، بزرگ‌ترین سفر ذهنی را شروع می‌کند...', en:'Sometimes a simple question starts the greatest mental journey...'},
            'footer-mid':{fa:'35mm · void · mind', en:'35mm · void · mind'},
            'footer-end':{fa:'v8.0', en:'v8.0'},
        };
        let lang = 'fa';

        function applyLang(l) {
            lang = l;
            root.setAttribute('lang', l === 'fa' ? 'fa' : 'en');
            root.setAttribute('dir', l === 'fa' ? 'rtl' : 'ltr');
            btn.textContent = l === 'fa' ? 'EN' : 'FA';
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (dict[key] && dict[key][l]) el.textContent = dict[key][l];
            });
            try { localStorage.setItem('lang', l); } catch(e){}
            document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
        }

        let saved = (() => { try { return localStorage.getItem('lang'); } catch(e){ return null; } })();
        if (saved) applyLang(saved);
        btn?.addEventListener('click', () => applyLang(lang === 'fa' ? 'en' : 'fa'));
    })();

    /* ---------- HERO TITLE TYPING LOOP (علی واهب ↔ Ali Vaheb) ---------- */
    (function () {
        const el = document.getElementById('hero-title-type');
        if (!el) return;
        const words = ['علی واهب', 'Ali Vaheb'];
        let wi = 0, ci = 0, deleting = false;
        function tick() {
            const w = words[wi];
            el.textContent = w.substring(0, ci);
            if (!deleting) {
                ci++;
                if (ci > w.length) { deleting = true; setTimeout(tick, 2000); return; }
                setTimeout(tick, 110);
            } else {
                ci--;
                if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
                setTimeout(tick, 50);
            }
        }
        setTimeout(tick, 500);
    })();

    /* ---------- EIGHT STAR CONSTELLATION (dense stars forming "8") ---------- */
    (function () {
        const canvas = document.getElementById('eight-stars');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W, H, stars8 = [];
        let mx = -999, my = -999;

        function resize() {
            const r = canvas.parentElement.getBoundingClientRect();
            W = canvas.width = Math.min(r.width, 400);
            H = canvas.height = W;
            build();
        }

        function build() {
            stars8 = [];
            const cx = W / 2, cy = H / 2;
            // lemniscate (∞) path points
            const R = W * .38;
            const N = 110;
            for (let i = 0; i < N; i++) {
                const t = (i / N) * Math.PI * 2;
                const denom = 1 + Math.sin(t) * Math.sin(t);
                const bx = cx + R * Math.cos(t) / denom;
                const by = cy + R * Math.sin(t) * Math.cos(t) / denom;
                stars8.push({
                    bx, by, x: bx, y: by,
                    r: Math.random() * 1.5 + .5,
                    tw: Math.random() * 6.28,
                    sp: .006 + Math.random() * .01,
                    col: Math.random() > .5 ? '245,166,35' : '34,211,238'
                });
            }
        }

        window.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mx = e.clientX - rect.left;
            my = e.clientY - rect.top;
        });
        document.addEventListener('mouseleave', () => { mx = -999; my = -999; });

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const REPEL = 46;
            // draw constellation links first
            for (let i = 0; i < stars8.length; i++) {
                const a = stars8[i];
                for (let j = i + 1; j < stars8.length; j++) {
                    const b = stars8[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    const dm = Math.min(
                        Math.hypot(a.x - mx, a.y - my),
                        Math.hypot(b.x - mx, b.y - my)
                    );
                    if (d < 34) {
                        const nearBoost = dm < REPEL ? .5 : 0;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(148,163,184,${(1 - d / 34) * .16 + nearBoost * .25})`;
                        ctx.lineWidth = nearBoost ? .8 : .4;
                        ctx.stroke();
                    }
                }
            }
            // then stars
            stars8.forEach(s => {
                const dx = s.x - mx, dy = s.y - my;
                const dist = Math.hypot(dx, dy);
                if (dist < REPEL && dist > .01) {
                    const force = (1 - dist / REPEL) * 1.3;
                    s.x += (dx / dist) * force;
                    s.y += (dy / dist) * force;
                } else {
                    s.x += (s.bx - s.x) * .07;
                    s.y += (s.by - s.y) * .07;
                }
                s.tw += s.sp;
                const near = dist < REPEL;
                const alpha = near ? 1 : .35 + (Math.sin(s.tw) + 1) / 2 * .65;
                const rad = s.r * (near ? 2.3 : 1);
                // star glow
                if (near) {
                    ctx.shadowColor = `rgba(${s.col},1)`;
                    ctx.shadowBlur = 16;
                }
                ctx.beginPath();
                ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.col},${alpha})`;
                ctx.fill();
                if (near) ctx.shadowBlur = 0;
            });
            requestAnimationFrame(draw);
        }
        resize();
        requestAnimationFrame(draw);
        window.addEventListener('resize', resize);
    })();

    /* ---------- FOOTER 8 (interactive bottom constellation) ---------- */
    (function () {
        const canvas = document.getElementById('footer-eight');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W, H, f8 = [];
        let hover = false;

        function resize() {
            W = canvas.width = 120;
            H = canvas.height = 120;
            build();
        }
        function build() {
            f8 = [];
            const cx = W / 2, cy = H / 2, R = W * .34;
            const N = 40;
            for (let i = 0; i < N; i++) {
                const t = (i / N) * Math.PI * 2;
                const x = cx + R * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
                const y = cy + R * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
                f8.push({ bx: x, by: y, x, y, r: Math.random() * 1.4 + .5, tw: Math.random() * 6.28, sp: .01 + Math.random() * .01, col: Math.random() > .4 ? '245,166,35' : '34,211,238' });
            }
        }

        canvas.addEventListener('mouseenter', () => hover = true);
        canvas.addEventListener('mouseleave', () => hover = false);

        function draw() {
            ctx.clearRect(0, 0, W, H);
            f8.forEach(s => {
                s.tw += s.sp;
                const tw = .4 + (Math.sin(s.tw) + 1) / 2 * .6;
                const rad = hover ? s.r * 2 : s.r;
                ctx.beginPath();
                ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.col},${tw})`;
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        resize();
        requestAnimationFrame(draw);
    })();

    /* ---------- CONTACT 8 (twin mirrored constellations, fleeing stars) ---------- */
    (function () {
        const canvases = [document.getElementById('contact-eight'), document.getElementById('contact-eight-r')].filter(Boolean);
        if (!canvases.length) return;
        const card = canvases[0].closest('.contact');
        let mx = -999, my = -999;

        card.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });
        card.addEventListener('mouseleave', () => { mx = -999; my = -999; });

        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            let W, H, stars = [];

            function resize() {
                W = canvas.width = 300;
                H = canvas.height = 400;
                build();
            }
            function build() {
                stars = [];
                const cx = W / 2, cy = H / 2;
                // vertical lemniscate (∞ rotated 90° = digit 8)
                const R = H * .4;
                const N = 140;
                for (let i = 0; i < N; i++) {
                    const t = (i / N) * Math.PI * 2;
                    const denom = 1 + Math.sin(t) * Math.sin(t);
                    const bx = cx + R * Math.sin(t) * Math.cos(t) / denom * .8;
                    const by = cy + R * Math.cos(t) / denom;
                    stars.push({
                        bx, by, x: bx, y: by,
                        r: Math.random() * 1.8 + .6,
                        tw: Math.random() * 6.28,
                        sp: .006 + Math.random() * .01,
                        col: Math.random() > .5 ? '245,166,35' : '34,211,238'
                    });
                }
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                const REPEL = 50;
                const r = canvas.getBoundingClientRect();
                const lmx = mx - r.left, lmy = my - r.top;
                // constellation links (thicker)
                for (let i = 0; i < stars.length; i++) {
                    const a = stars[i];
                    for (let j = i + 1; j < stars.length; j++) {
                        const b = stars[j];
                        const d = Math.hypot(a.x - b.x, a.y - b.y);
                        const dm = Math.min(Math.hypot(a.x - lmx, a.y - lmy), Math.hypot(b.x - lmx, b.y - lmy));
                        if (d < 40) {
                            const nearBoost = dm < REPEL ? .6 : 0;
                            ctx.beginPath();
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                            ctx.strokeStyle = `rgba(148,163,184,${(1 - d / 40) * .22 + nearBoost * .3})`;
                            ctx.lineWidth = nearBoost ? 1.4 : .7;
                            ctx.stroke();
                        }
                    }
                }
                stars.forEach(s => {
                    const dx = s.x - lmx, dy = s.y - lmy;
                    const dist = Math.hypot(dx, dy);
                    if (dist < REPEL && dist > .01) {
                        const f = (1 - dist / REPEL) * 1.4;
                        s.x += (dx / dist) * f;
                        s.y += (dy / dist) * f;
                    } else {
                        s.x += (s.bx - s.x) * .07;
                        s.y += (s.by - s.y) * .07;
                    }
                    s.tw += s.sp;
                    const near = dist < REPEL;
                    const alpha = near ? 1 : .35 + (Math.sin(s.tw) + 1) / 2 * .65;
                    const rad = s.r * (near ? 2.5 : 1.2);
                    if (near) {
                        ctx.shadowColor = `rgba(${s.col},1)`;
                        ctx.shadowBlur = 20;
                    }
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${s.col},${alpha})`;
                    ctx.fill();
                    if (near) ctx.shadowBlur = 0;
                });
                requestAnimationFrame(draw);
            }
            resize();
            requestAnimationFrame(draw);
        });
    })();

    /* ---------- NIGHT MODE HINT (recommend dark mode) ---------- */
    (function () {
        const hint = document.getElementById('night-hint');
        const btn = document.getElementById('night-hint-btn');
        const text = document.getElementById('night-hint-text');
        if (!hint || !btn) return;

        const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

        function sync() {
            if (isDark()) {
                hint.classList.remove('show');
            } else {
                hint.classList.add('show');
            }
        }

        btn.addEventListener('click', () => {
            // trigger the existing theme toggle
            const toggle = document.getElementById('theme-toggle');
            if (toggle) toggle.click();
            // after switching to dark, hide hint
            setTimeout(sync, 300);
        });

        // change the rotating message
        const msgs = [
            'شب، آسمان را زیباتر می‌کند...',
            'ستاره‌ها فقط در تاریکی دیده می‌شوند',
            'حالت شب = تجربه فضایی بهتر'
        ];
        let mi = 1;
        if (text) setInterval(() => {
            text.textContent = msgs[mi];
            mi = (mi + 1) % msgs.length;
        }, 6000);

        // sync on load and whenever theme changes
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    })();

    /* ---------- TYPEWRITER (commands, show-don't-tell) ---------- */
    (function () {
        const el = document.getElementById('typewriter');
        if (!el) return;
        const words = [
            'build --future',
            'watch --35mm',
            'observe --deep-space',
            'ask --endless'
        ];
        let wi = 0, ci = 0, deleting = false;
        function tick() {
            const w = words[wi];
            el.textContent = w.substring(0, ci);
            if (!deleting) {
                ci++;
                if (ci > w.length) { deleting = true; setTimeout(tick, 1800); return; }
                setTimeout(tick, 75);
            } else {
                ci--;
                if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
                setTimeout(tick, 40);
            }
        }
        tick();
    })();

    /* ---------- REVEAL + SKILL BARS ---------- */
    (function () {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                e.target.classList.add('visible');
                e.target.querySelectorAll('.skill__fill').forEach(f => {
                    const w = f.getAttribute('data-w');
                    if (w) setTimeout(() => { f.style.width = w + '%'; }, 150);
                });
                io.unobserve(e.target);
            });
        }, { threshold: .12 });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
            document.querySelectorAll('.skill__fill').forEach(f => {
                const w = f.getAttribute('data-w');
                if (w) f.style.width = w + '%';
            });
        }
        window.__revealObserve = io;
    })();

    /* ---------- STACK SCRAMBLE (percentages + chips) ---------- */
    (function () {
        const sec = document.getElementById('skills');
        if (!sec) return;
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                runScramble();
                io.unobserve(e.target);
            });
        }, { threshold: .3 });
        io.observe(sec);

        function runScramble() {
            const skills = sec.querySelectorAll('.skill');
            skills.forEach((s, i) => {
                const fill = s.querySelector('.skill__fill');
                const val = s.querySelector('.skill__head .mono');
                const isInf = val && val.textContent.trim() === '∞';
                const target = parseInt(fill.getAttribute('data-w'), 10);

                setTimeout(() => s.classList.add('animate'), i * 160);

                if (!val || isNaN(target)) return;

                if (isInf) {
                    // infinity bar: pulse the width a couple of times, keep ∞
                    const puls = setInterval(() => {
                        fill.style.width = (30 + Math.random() * 70) + '%';
                    }, 200);
                    setTimeout(() => {
                        clearInterval(puls);
                        fill.style.transition = 'width .8s ease';
                        fill.style.width = '100%';
                    }, 2200);
                    return;
                }

                // smooth scramble: slow convergence with easing
                let tick = 0;
                const maxTicks = 24;
                const timer = setInterval(() => {
                    tick++;
                    if (tick >= maxTicks) {
                        clearInterval(timer);
                        val.textContent = target + '%';
                        fill.style.transition = 'width .8s ease';
                        fill.style.width = target + '%';
                        return;
                    }
                    const progress = tick / maxTicks;
                    const range = Math.max(5, Math.round((100 - target) * (1 - progress)));
                    const fake = target + Math.floor((Math.random() * 2 - 1) * range);
                    val.textContent = Math.max(0, Math.min(100, fake)) + '%';
                    fill.style.transition = 'width .2s ease';
                    fill.style.width = Math.max(0, Math.min(100, fake)) + '%';
                }, 110);
            });

            // chips scatter in with stagger
            const chipsWrap = sec.querySelector('.skills__chips');
            if (chipsWrap) {
                const chips = chipsWrap.querySelectorAll('.chip');
                chips.forEach((c, i) => {
                    c.style.transitionDelay = (0.4 + i * 0.05) + 's';
                });
                setTimeout(() => chipsWrap.classList.add('animate'), 350);
            }
        }
    })();

    /* ---------- TILT ---------- */
    (function () {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        document.querySelectorAll('[data-tilt]').forEach(el => {
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - .5;
                const y = (e.clientY - r.top) / r.height - .5;
                el.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-6px)`;
            });
            el.addEventListener('mouseleave', () => { el.style.transform = ''; });
        });
    })();

    /* ---------- TO TOP ---------- */
    (function () {
        const btn = document.getElementById('to-top');
        window.addEventListener('scroll', () => { btn.classList.toggle('show', scrollY > 500); }, { passive: true });
        btn?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    })();

    /* ---------- SIGNAL (email submit via Web3Forms) ---------- */
    (function () {
        const form = document.getElementById('signal-form');
        const status = document.getElementById('signal-status');
        const keyInput = document.getElementById('w3f-key');

        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Check if access key is set
            const key = keyInput?.value;
            if (!key || key === 'YOUR_WEB3FORMS_KEY') {
                if (status) {
                    status.textContent = '⚠️ ابتدا یک کلید رایگان از web3forms.com بگیر و اینجا بذار.';
                    status.className = 'signal__status mono error';
                }
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = '⏳ transmitting...';

            const formData = new FormData(form);

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.success) {
                    if (status) {
                        status.textContent = '✓ سیگنال با موفقیت ارسال شد. به زودی پاسخ می‌دهم.';
                        status.className = 'signal__status mono success';
                    }
                    form.reset();
                } else {
                    if (status) {
                        status.textContent = '✗ خطا در ارسال: ' + (data.message || 'نامشخص');
                        status.className = 'signal__status mono error';
                    }
                }
            } catch (err) {
                if (status) {
                    status.textContent = '✗ خطای شبکه: ' + err.message;
                    status.className = 'signal__status mono error';
                }
            }

            btn.disabled = false;
            btn.textContent = '~/transmit ⇡';
        });
    })();

    /* ---------- BLOG FRAMES (loaded from data/blog.json) ---------- */
    (function () {
        const wrap = document.getElementById('blog-frames');
        if (!wrap) return;

        let posts = [];

        function currentLang() {
            return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'fa';
        }

        function render() {
            const lang = currentLang();
            if (!posts.length) {
                wrap.innerHTML = '<p class="frame-post__empty mono" data-i18n="blog-empty">&gt; هیچ پستی هنوز ثبت نشده...</p>';
                return;
            }
            wrap.innerHTML = posts.map(p => {
                const title = p['title_' + lang] || p.title_fa || p.title_en || '';
                const excerpt = p['excerpt_' + lang] || p.excerpt_fa || p.excerpt_en || '';
                const href = p.link ? ` href="${p.link}" target="_blank" rel="noopener"` : ' href="#"';
                const icon = p.link ? '↗' : '→';
                return `<article class="frame-post">
                    <div class="frame-post__meta mono">
                        <span class="frame-post__tag">${p.tag || 'thought'}</span>
                        <span class="frame-post__date">${p.date || ''}</span>
                    </div>
                    <h3 class="frame-post__title"></h3>
                    <p class="frame-post__excerpt"></p>
                    <a${href} class="frame-post__link mono">read ${icon}</a>
                </article>`;
            }).join('');
            wrap.querySelectorAll('.frame-post').forEach((card, i) => {
                const p = posts[i];
                card.querySelector('.frame-post__title').textContent = p['title_' + lang] || p.title_fa || p.title_en || '';
                card.querySelector('.frame-post__excerpt').textContent = p['excerpt_' + lang] || p.excerpt_fa || p.excerpt_en || '';
            });
        }

        fetch('data/blog.json')
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(data => { posts = Array.isArray(data.posts) ? data.posts : []; render(); })
            .catch(() => { wrap.innerHTML = ''; });

        document.addEventListener('langchange', render);
    })();

    /* ---------- PROJECTS (loaded from data/projects.json) ---------- */
    (function () {
        const wrap = document.getElementById('projects-grid');
        if (!wrap) return;

        let projects = [];
        let placeholder = null;

        function currentLang() {
            return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'fa';
        }

        function render() {
            const lang = currentLang();
            if (!projects.length) {
                wrap.innerHTML = '';
                return;
            }
            const cards = projects.map(p => {
                const title = p['title_' + lang] || p.title_fa || p.title_en || p.name;
                const desc = p['desc_' + lang] || p.desc_fa || p.desc_en || '';
                const tags = toArr(p.tags).map(t => `<span>${t}</span>`).join('');
                const links = toArr(p.links).map(l => `<a href="${l.url}" class="project__demo">↗ ${l.label}</a>`).join('');
                const singleLink = p.link ? `<a href="${p.link}" class="project__demo">↗ دمو</a>` : '';
                return `<article class="project" data-tilt>
                    <div class="project__top">
                        <span class="project__name mono">${p.name || ''}</span>
                        <span class="project__lang mono">${p.lang || ''}</span>
                    </div>
                    <h3 class="project__title"></h3>
                    <p class="project__desc"></p>
                    <div class="project__tags mono">${tags}${singleLink}${links}</div>
                </article>`;
            }).join('');

            // placeholder card
            let phCard = '';
            if (placeholder) {
                const phTitle = placeholder['title_' + lang] || placeholder.title_fa || placeholder.title_en || '';
                const phDesc = placeholder['desc_' + lang] || placeholder.desc_fa || placeholder.desc_en || '';
                phCard = `<article class="project project--placeholder">
                    <div class="project__top">
                        <span class="project__name mono">${placeholder.name || 'coming'}</span>
                        <span class="project__lang mono">${placeholder.lang || 'soon'}</span>
                    </div>
                    <h3 class="project__title"></h3>
                    <p class="project__desc"></p>
                    <div class="project__tags mono"><span class="chip--soon">…</span></div>
                </article>`;
            }

            wrap.innerHTML = cards + phCard;
            wrap.querySelectorAll('.project').forEach((card, i) => {
                const p = i < projects.length ? projects[i] : placeholder;
                if (!p) return;
                const title = p['title_' + lang] || p.title_fa || p.title_en || '';
                const desc = p['desc_' + lang] || p.desc_fa || p.desc_en || '';
                card.querySelector('.project__title').textContent = title;
                card.querySelector('.project__desc').textContent = desc;
            });
        }

        function toArr(v) {
            if (Array.isArray(v)) return v;
            if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
            return [];
        }

        fetch('data/projects.json')
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(data => {
                projects = Array.isArray(data.projects) ? data.projects : [];
                placeholder = data.placeholder || null;
                render();
            })
            .catch(() => { wrap.innerHTML = ''; });

        document.addEventListener('langchange', render);
    })();
})();