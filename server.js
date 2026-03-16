require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/download', (req, res) => {
    const file = path.join(__dirname, 'public', 'ebook.pdf');
    res.download(file, 'ebook.pdf', (err) => {
        if (err) {
            console.error('PDF download error:', err);
            res.status(404).send('Súbor nebol nájdený.');
        }
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server beží na http://localhost:${PORT}`);
});
