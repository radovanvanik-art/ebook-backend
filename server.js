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

// ─── Jazykové varianty /en/ /de/ /ua/ neexistujú → 410 Gone ─────────────
app.get('/:lang(en|de|ua)/:page', (req, res) => {
    res.status(410).end();
});

// ─── PODSTRÁNKY E-KNÍH ────────────────────────────────────────────────────
const subpages = ['prvy-byt', 'dedicstvo', 'exekucia', 'rozvod', 'retazovy-obchod', 'o-mne', 'mapa', 'faq', 'blogy', 'ocenenie-bytu', 'eknihy', 'kalkulacka'];
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

    const noteHtml = (note || '').replace(/\n/g, '<br>');
    const firstName = name.split(' ')[0] || name;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName  = process.env.BREVO_SENDER_NAME || 'Radovan Vaník';
    const myEmail     = process.env.MY_EMAIL || senderEmail;

    try {
        // 1. Ulož kontakt do Brevo
        const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
            body: JSON.stringify({
                email,
                listIds: [parseInt(process.env.BREVO_LIST_ID_LEADS || '3')],
                updateEnabled: true,
                attributes: {
                    FIRSTNAME: firstName,
                    LASTNAME:  name.split(' ').slice(1).join(' ') || '',
                    NOTE:      (phone ? `Tel: ${phone}\n` : '') + (note || '')
                }
            })
        });
        const brevoErr = await brevoRes.json().catch(() => ({}));
        if (!brevoRes.ok && brevoRes.status !== 204 && brevoRes.status !== 201 && brevoErr.code !== 'duplicate_parameter') {
            console.error('Brevo lead error:', brevoErr);
            return res.status(502).json({ error: 'Chyba pri ukladaní kontaktu.' });
        }

        // 2. Notifikačný email TEBE — celý popis nehnuteľnosti
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
            body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email: myEmail, name: senderName }],
                subject: `🏠 Nový lead: Ocenenie nehnuteľnosti — ${name}`,
                htmlContent: `
                    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222">
                        <h2 style="color:#8a6a1e">Nový záujemca o ocenenie</h2>
                        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                            <tr><td style="padding:6px 0;color:#666;width:140px">Meno:</td><td><strong>${name}</strong></td></tr>
                            <tr><td style="padding:6px 0;color:#666">Telefón:</td><td><strong>${phone || '—'}</strong></td></tr>
                            <tr><td style="padding:6px 0;color:#666">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
                        </table>
                        <h3 style="color:#8a6a1e;margin-bottom:8px">Parametre nehnuteľnosti:</h3>
                        <div style="background:#f9f6f0;border-left:3px solid #c9a84c;padding:16px;font-size:14px;line-height:1.8">
                            ${noteHtml}
                        </div>
                        <p style="margin-top:20px">
                            <a href="tel:${phone || ''}" style="background:#c9a84c;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;font-weight:bold">📞 Zavolať klientovi</a>
                        </p>
                    </div>`
            })
        }).catch(e => console.error('Notify mail error:', e));

        // 3. Potvrdzovací email KLIENTOVI
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
            body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email, name: firstName }],
                subject: 'Vaša žiadosť o ocenenie nehnuteľnosti bola prijatá',
                htmlContent: `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#222">
                        <h2 style="color:#8a6a1e">Ďakujem za váš záujem, ${firstName}!</h2>
                        <p>Vaša žiadosť o bezplatné ocenenie nehnuteľnosti bola prijatá.</p>
                        <p>Ozvem sa vám do <strong>24 hodín</strong> so zoznamom overených záujemcov a podrobnou analýzou trhovej ceny vo vašej lokalite.</p>
                        <p style="margin-top:24px">Ak potrebujete niečo urgentné, zavolajte mi priamo:</p>
                        <p><a href="tel:+421948310950" style="font-size:18px;font-weight:bold;color:#8a6a1e">+421 948 310 950</a></p>
                        <p style="margin-top:32px">S pozdravom,<br>
                        <strong>${senderName}</strong><br>
                        Realitný maklér · Reality Najbývanie</p>
                        <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
                        <p style="font-size:11px;color:#999"><a href="https://www.radovanvanik.com">radovanvanik.com</a></p>
                    </div>`
            })
        }).catch(e => console.error('Confirm mail error:', e));

        return res.json({ success: true });
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
