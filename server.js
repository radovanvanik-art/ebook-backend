require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const BOOK_TITLES = {
  'ebook-prvy-byt':         'Váš prvý byt',
  'ebook-dedicstvo':        'Zdedený byt',
  'ebook-exekucia':         'Exekúcia na dverách',
  'ebook-rozvod':           'Rozvod a predaj majetku',
  'ebook-retazovy-obchod':  'Reťazový obchod'
};

const app = express();
const PORT = process.env.PORT || 3000;

function sendHtmlNoCache(res, filePath) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
}

// ─── HTTP → HTTPS + non-www → www redirect (produkcia) ──────────────────
app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    const host = req.headers['x-forwarded-host'] || req.headers['host'] || '';
    const isHttp = proto === 'http';
    const isNonWww = host === 'radovanvanik.com';
    if (isHttp || isNonWww) {
        return res.redirect(301, 'https://www.radovanvanik.com' + req.url);
    }
    next();
});

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.html') {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff2', '.woff', '.mp4', '.webm'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// ─── POST /api/subscribe ───────────────────────────────────────────────────
app.post('/api/subscribe', async (req, res) => {
    const { email, bookType } = req.body;
    try {
        const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                email,
                listIds: [parseInt(process.env.BREVO_LIST_ID)],
                updateEnabled: true,
                attributes: {
                    "BOOK_TYPE": bookType
                }
            })
        });

        if (!brevoRes.ok && brevoRes.status !== 204) {
            const errBody = await brevoRes.json().catch(() => ({}));
            console.error('Brevo error:', errBody);
            return res.status(502).json({ error: 'Chyba pri ukladaní emailu.' });
        }
        return res.json({ success: true, downloadUrl: '/download' });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Interná chyba servera.' });
    }
}); // Toto je správne uzavretie app.post

app.get('/download/:bookName', (req, res) => {
    const bookName = req.params.bookName;
    const file = path.join(__dirname, 'public', `${bookName}.pdf`);
    
    res.download(file, `${bookName}.pdf`, (err) => {
        if (err) {
            console.error('PDF download error:', err);
            res.status(404).send('Súbor nebol nájdený.');
        }
    });
});

// ─── GOOGLE MAPS API KEY ──────────────────────────────────────────────────
app.get('/api/maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// ─── PRESMEROVANIE /index.html → / (SEO: zamedzí duplikátu) ──────────────
app.get('/index.html', (req, res) => {
    res.redirect(301, '/');
});

// ─── PRESMEROVANIE jazykových variant /en/ /de/ /ua/ → SK verzia ─────────
app.get('/:lang(en|de|ua)/:page', (req, res) => {
    res.redirect(301, `/${req.params.page}`);
});

// ─── PODSTRÁNKY E-KNÍH ────────────────────────────────────────────────────
const subpages = ['prvy-byt', 'dedicstvo', 'exekucia', 'rozvod', 'retazovy-obchod', 'o-mne', 'mapa', 'faq', 'blogy', 'ocenenie-bytu'];
subpages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        sendHtmlNoCache(res, path.join(__dirname, 'public', `${page}.html`));
    });
    // Presmerovanie /stránka.html → /stránka
    app.get(`/${page}.html`, (req, res) => {
        res.redirect(301, `/${page}`);
    });
});

// ─── POST /api/lead (ocenenie-bytu) ──────────────────────────────────────
app.post('/api/lead', async (req, res) => {
    const { name, phone, email, note } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Neplatný email.' });
    if (!name) return res.status(400).json({ error: 'Chýba meno.' });
    try {
        const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                email,
                listIds: [parseInt(process.env.BREVO_LIST_ID_LEADS || '3')],
                updateEnabled: true,
                attributes: {
                    FIRSTNAME: name.split(' ')[0] || name,
                    LASTNAME:  name.split(' ').slice(1).join(' ') || '',
                    SMS:       phone || '',
                    NOTE:      note || ''
                }
            })
        });
        if (brevoRes.ok || brevoRes.status === 204 || brevoRes.status === 201) {
            return res.json({ success: true });
        }
        const err = await brevoRes.json().catch(() => ({}));
        if (err.code === 'duplicate_parameter') return res.json({ success: true });
        console.error('Brevo lead error:', err);
        return res.status(502).json({ error: 'Chyba pri ukladaní kontaktu.' });
    } catch (err) {
        console.error('Lead server error:', err);
        return res.status(500).json({ error: 'Interná chyba servera.' });
    }
});

// ─── SEO FILES ────────────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('*', (req, res) => {
    sendHtmlNoCache(res, path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server beží na http://localhost:${PORT}`);
});
