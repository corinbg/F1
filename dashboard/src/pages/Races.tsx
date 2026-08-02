import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Race } from '../lib/types'

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function daysUntil(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86_400_000)
  return diff
}

export default function Races() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase.from('races').select('*').order('round', { ascending: true })
        if (err) throw err
        setRaces((data ?? []) as Race[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Impossibile contattare Supabase.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const nextRace = races.find((r) => r.status === 'upcoming')

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Calendario stagione</h1>
      <p className="text-sm text-neutral-400 mb-5">
        Clicca su una gara completata per vedere risultati, giro veloce e classifiche.
      </p>

      {error && (
        <p className="text-sm text-red-400 mb-4">
          Errore nel caricamento dei dati: {error}
        </p>
      )}

      {nextRace && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-red-400 font-bold mb-1">Prossima gara</p>
            <p className="text-lg font-bold text-white">{nextRace.name}</p>
            <p className="text-sm text-neutral-400">
              {nextRace.circuit_name} · {formatDate(nextRace.race_date)}
            </p>
          </div>
          {daysUntil(nextRace.race_date) !== null && (
            <div className="text-right">
              <p className="text-3xl font-extrabold text-white">{daysUntil(nextRace.race_date)}</p>
              <p className="text-xs text-neutral-400">giorni</p>
            </div>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-neutral-400">Caricamento…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {races.map((race) => {
          const clickable = race.status === 'completed'
          const card = (
            <div
              className={`rounded-lg border p-4 transition-colors ${
                race.status === 'completed'
                  ? 'border-white/10 bg-[#15171c] hover:border-red-500/60'
                  : 'border-dashed border-white/10 bg-[#101216] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Round {race.round}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    race.status === 'completed'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-neutral-500/15 text-neutral-400'
                  }`}
                >
                  {race.status === 'completed' ? 'Completata' : 'In programma'}
                </span>
              </div>
              <p className="font-semibold text-white text-sm">{race.name}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {race.circuit_name} · {formatDate(race.race_date)}
              </p>
            </div>
          )
          return clickable ? (
            <Link key={race.race_id} to={`/races/${race.race_id}`}>
              {card}
            </Link>
          ) : (
            <div key={race.race_id}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
