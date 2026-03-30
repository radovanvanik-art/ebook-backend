require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

function sendHtmlNoCache(res, filePath) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
}

// ─── HTTP → HTTPS redirect (produkcia) ───────────────────────────────────
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
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
        } else if (['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff2', '.woff'].includes(ext)) {
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

// ─── PODSTRÁNKY E-KNÍH ────────────────────────────────────────────────────
const subpages = ['prvy-byt', 'dedicstvo', 'exekucia', 'rozvod', 'retazovy-obchod', 'o-mne', 'mapa', 'faq'];
subpages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        sendHtmlNoCache(res, path.join(__dirname, 'public', `${page}.html`));
    });
    // Presmerovanie /stránka.html → /stránka
    app.get(`/${page}.html`, (req, res) => {
        res.redirect(301, `/${page}`);
    });
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
