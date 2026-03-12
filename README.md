# E-book Landing Page + Brevo Backend

## Štruktúra projektu
```
ebook-backend/
├── server.js          ← Express backend
├── .env               ← Tvoje tajné premenné (NEVKLADAJ do gitu!)
├── .env.example       ← Šablóna
├── .gitignore
├── package.json
└── public/
    ├── index.html     ← Landing page
    └── ebook.pdf      ← ← ← SEM VLOŽ SVOJU E-KNIHU
```

## Čo musíš urobiť manuálne

### 1. Brevo API key
- Registruj sa na brevo.com
- Settings → API Keys → Create API Key
- Skopíruj kľúč

### 2. Brevo List ID  
- Contacts → Lists → Create a list → "Ebook subscribers"
- Zapamätaj si číslo listu (napr. 5)

### 3. Nastav .env
```
cp .env.example .env
# Otvor .env a vlož svoje hodnoty
```

### 4. Vlož PDF
```
cp /cesta/k/tvojej/knihe.pdf public/ebook.pdf
```

### 5. Spusti lokálne
```
npm install
npm start
# → http://localhost:3000
```

### 6. Deploy na Railway (odporúčam)
- railway.app → New Project → Deploy from GitHub
- Variables: BREVO_API_KEY + BREVO_LIST_ID
- Automatický HTTPS + custom doména
