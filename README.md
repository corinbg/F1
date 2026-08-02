# F1 Instagram Content Studio

Dashboard per generare idee di post Instagram per una pagina Formula 1, basata sui dati di gara (risultati, qualifiche, classifiche) sincronizzati automaticamente su Supabase tramite n8n.

## Architettura

```
Jolpica API (Ergast-compatible)  →  n8n "F1 Data Sync"  →  Supabase (Postgres)  →  n8n "F1 Content Idea Generator"  →  Supabase (content_ideas)  →  Dashboard (React)
```

- **Supabase** — progetto `f1-instagram-dashboard` (`eyvjczgmjmbszqvejctd`). Contiene lo schema dati F1 (`races`, `drivers`, `constructors`, `results`, `qualifying_results`, `driver_standings`, `constructor_standings`) e la tabella editoriale `content_ideas`.
- **n8n** (`F1 Data Sync`) — recupera calendario, risultati, qualifiche e classifiche della stagione corrente da [Jolpica](https://api.jolpi.ca/ergast/) (continuazione community della Ergast API, stesso formato dati usato da FastF1) e fa upsert su Supabase. Gira ogni lunedì alle 06:00 UTC, oppure on-demand.
- **n8n** (`F1 Content Idea Generator`) — legge le ultime gare completate e genera automaticamente idee di post (podio, giro veloce, rimonta, colpi di scena, classifica) con caption in italiano, hashtag ed emoji pronte per Instagram.
- **Dashboard** (`/dashboard`) — Vite + React + TypeScript + Tailwind, si collega a Supabase con la chiave pubblica (anon). Bacheca kanban delle idee (Idea → Bozza → Programmato → Pubblicato) con editor e anteprima in stile post Instagram, più il calendario gare con risultati/podio/qualifiche/classifiche.

### Perché n8n per i dati e non FastF1 direttamente

L'ambiente di sviluppo usato per costruire questo progetto non ha accesso di rete verso i server F1/Ergast (né in generale verso host esterni non in whitelist), quindi non è stato possibile eseguire la libreria Python `fastf1` da qui. I workflow n8n girano invece sui server di n8n, con accesso a internet reale, quindi sono loro a scaricare i dati e scriverli su Supabase. I dati usati (via Jolpica) sono lo stesso tipo di informazioni di gara che FastF1 espone (risultati, giri veloci, qualifiche, classifiche), in formato REST invece che tramite la libreria Python.

## Setup dashboard

```bash
cd dashboard
cp .env.example .env   # già valorizzato con URL e anon key del progetto Supabase
npm install
npm run dev
```

La chiave in `.env.example` è la **anon/publishable key** di Supabase: è pensata per essere esposta lato client ed è protetta dalle policy RLS del database (sola lettura sui dati di gara, lettura/scrittura sulla tabella `content_ideas`).

## Popolare i dati

I due workflow n8n sono già pubblicati e schedulati:

- **F1 Data Sync** — lunedì alle 06:00 UTC (dopo ogni weekend di gara). Eseguibile anche manualmente da n8n.
- **F1 Content Idea Generator** — ogni giorno alle 08:00 UTC. Genera automaticamente le idee per le gare completate non ancora coperte.

Per generare subito nuovi contenuti dopo una gara, basta eseguire manualmente i due workflow da n8n nell'ordine sopra.

## Note di sicurezza / limiti noti

- Le tabelle dati F1 (`races`, `drivers`, ecc.) hanno RLS con lettura pubblica e scrittura pubblica (necessaria perché n8n scrive con la stessa anon key, senza credenziali service_role). Va bene per un tool interno single-tenant senza login; se in futuro la dashboard diventa pubblica o multi-utente, conviene spostare le scritture di n8n su una chiave `service_role` (da configurare come credenziale in n8n) e restringere le policy di scrittura sulle tabelle dati al solo `service_role`.
- `content_ideas` è leggibile e scrivibile pubblicamente (bacheca editoriale senza autenticazione): adatto a un tool ad uso personale/team ristretto.
