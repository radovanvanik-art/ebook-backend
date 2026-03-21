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

Chcem možnosť 2 , ale chcem viacej pod stránok mam 5 e kníh - 
Tu je zoznam vašich e-bookov:

**E-booky NajBývanie:**

- **Zdedili ste nehnuteľnosť?** – 20 strán, téma: dedičstvo, emócia: zmätok a papierovačky
- **Exekúcia na dverách** – 26 strán, téma: dlhová kríza, emócia: strach a naliehavosť
- **Rozvod a predaj majetku** – 24 strán, téma: rozvod, emócia: bolesť a nový začiatok
- **Váš prvý byt** – 26 strán, téma: prvá kúpa, emócia: vzrušenie a nádej
- **Reťazový obchod** – 32 strán, téma: predaj + kúpa súčasne, emócia: koordinácia a stres

**Súbory:**
- ebook-zdedene-nehnutelnosti.pdf
- ebook-exekucia.pdf
- ebook-rozvod.pdf
- ebook-prvy-byt.pdf
- ebook-retazovy-obchod.pdf


 na každu chcem podstránku a chem aby sa nejako trendy profesionálne ukazali na hlavnej stránke kde sa uživatelia môžu prekliknuť nejakym dynamickým spôsobom