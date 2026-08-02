# F1 Content Studio — dashboard

Vite + React + TypeScript + Tailwind, connesso a Supabase. Vedi il [README principale](../README.md) per l'architettura completa (n8n + Supabase + dashboard).

## Sviluppo

```bash
cp .env.example .env
npm install
npm run dev
```

## Struttura

- `src/pages/ContentBoard.tsx` — bacheca kanban delle idee di post (Idea / Bozza / Programmato / Pubblicato).
- `src/pages/Races.tsx`, `src/pages/RaceDetail.tsx` — calendario stagione e dettaglio gara (podio, giro veloce, qualifiche, classifiche).
- `src/components/IdeaEditor.tsx` — editor con anteprima in stile post Instagram, editing di caption/hashtag/stato.
- `src/lib/supabase.ts` — client Supabase (anon key, da `.env`).
