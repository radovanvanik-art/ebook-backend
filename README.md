# ebook-backend — radovanvanik.com

Landing page a backend pre radovanvanik.com — realitný maklér Radovan Vaník
(Reality Najbývanie, Ružomberok). Statické stránky v `public/`, servované cez
malý Express server (`server.js`), lead capture a email cez Brevo, nasadené na
Railway.

## Stack

- Node.js + Express (statický hosting `public/`, pár API routes, SEO redirecty)
- Brevo (kontakty + transakčné emaily pre `/api/subscribe` a `/api/lead`)
- Google Maps JS API (`/mapa`)
- Žiadny build krok — čisté HTML/CSS/JS na strane klienta

## Lokálne spustenie

```bash
npm install
cp .env.example .env   # doplň skutočné hodnoty (Brevo API key, Google Maps key...)
npm start
```

Server beží na `http://localhost:3000` (alebo podľa `PORT` v `.env`). Bez
platného `BREVO_API_KEY` formuláre (`/eknihy`, `/ocenenie-bytu`) zbehnú
vizuálne, ale odoslanie e-mailu zlyhá — to je pri lokálnom vývoji očakávané.

## Štruktúra

- `server.js` — statický hosting, redirecty (http→https, non-www→www,
  `.html`→bez prípony), `/api/subscribe` (e-book lead magnet), `/api/lead`
  (ocenenie nehnuteľnosti), `/download/:bookName` (PDF e-knihy)
- `public/` — jednotlivé stránky, každá je samostatný `.html` súbor bez
  spoločného layoutu (žiadny templating systém — pri úprave nav/footer treba
  meniť každý súbor zvlášť)

## Známy problém: apex doména (bez `www`)

`radovanvanik.com` (bez www) má na registrátorovi (GoDaddy) nastavený domain
forwarding, ktorý presmeruje iba `/` na `https://www.radovanvanik.com` — nie
však podstránky (`radovanvanik.com/eknihy` vracia 404, namiesto aby prešlo cez
redirect logiku v `server.js`). Riešenie: pridať apex doménu ako custom domain
priamo v Railway a presmerovať DNS záznamy na registrátorovi tam namiesto
GoDaddy "Forwarding" produktu — vyžaduje prístup k Railway/GoDaddy účtu, nie
je to zmena v kóde.
