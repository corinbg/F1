import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ConstructorStanding, ContentIdea, DriverStanding, QualifyingResult, Race, Result } from '../lib/types'
import { ideaMeta } from '../lib/ideaMeta'

function positionDelta(grid: number | null, position: number | null) {
  if (grid === null || grid === 0 || position === null) return null
  return grid - position
}

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>()
  const [race, setRace] = useState<Race | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [qualifying, setQualifying] = useState<QualifyingResult[]>([])
  const [standings, setStandings] = useState<DriverStanding[]>([])
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([])
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    setError(null)
    Promise.all([
      supabase.from('races').select('*').eq('race_id', raceId).single(),
      supabase
        .from('results')
        .select('*, drivers(given_name, family_name, code), constructors(name, color)')
        .eq('race_id', raceId)
        .order('position', { ascending: true, nullsFirst: false }),
      supabase
        .from('qualifying_results')
        .select('*, drivers(given_name, family_name, code), constructors(name, color)')
        .eq('race_id', raceId)
        .order('position', { ascending: true }),
      supabase
        .from('driver_standings')
        .select('*, drivers(given_name, family_name, code, current_constructor_id)')
        .eq('race_id', raceId)
        .order('position', { ascending: true })
        .limit(10),
      supabase
        .from('constructor_standings')
        .select('*, constructors(name, color)')
        .eq('race_id', raceId)
        .order('position', { ascending: true })
        .limit(10),
      supabase.from('content_ideas').select('*').eq('race_id', raceId).order('created_at', { ascending: false }),
    ])
      .then(([r, res, qual, stand, constStand, contentIdeas]) => {
        if (r.error) throw r.error
        setRace(r.data as Race)
        setResults((res.data ?? []) as Result[])
        setQualifying((qual.data ?? []) as QualifyingResult[])
        setStandings((stand.data ?? []) as DriverStanding[])
        setConstructorStandings((constStand.data ?? []) as ConstructorStanding[])
        setIdeas((contentIdeas.data ?? []) as ContentIdea[])
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Impossibile contattare Supabase.')
      })
      .finally(() => setLoading(false))
  }, [raceId])

  if (loading) return <p className="text-sm text-neutral-400">Caricamento…</p>
  if (error) return <p className="text-sm text-red-400">Errore nel caricamento: {error}</p>
  if (!race) return <p className="text-sm text-red-400">Gara non trovata.</p>

  const podium = results.filter((r) => r.position !== null && r.position <= 3)
  const fastestLap = results.find((r) => r.fastest_lap_rank === 1)
  const poleResult = qualifying.find((q) => q.position === 1)
  const retirements = results.filter((r) => r.position === null).length
  const totalLaps = results.reduce((max, r) => (r.laps !== null && r.laps > max ? r.laps : max), 0)
  const bestRecovery = results.reduce<{ name: string; gained: number } | null>((best, r) => {
    const delta = positionDelta(r.grid, r.position)
    if (delta === null || delta <= 0) return best
    if (best && delta <= best.gained) return best
    return { name: `${r.drivers?.given_name ?? ''} ${r.drivers?.family_name ?? ''}`.trim(), gained: delta }
  }, null)

  return (
    <div>
      <Link to="/races" className="text-sm text-neutral-400 hover:text-white">
        ← Calendario
      </Link>
      <h1 className="text-2xl font-bold text-white mt-2">{race.name}</h1>
      <p className="text-sm text-neutral-400 mb-6">
        {race.circuit_name} · {race.country} · Round {race.round}
      </p>

      {podium.length === 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[podium[1], podium[0], podium[2]].map((r, i) => {
            const order = [2, 1, 3][i]
            const medal = order === 1 ? '🥇' : order === 2 ? '🥈' : '🥉'
            return (
              <div
                key={r.id}
                className={`rounded-lg border border-white/10 bg-[#15171c] p-2 sm:p-4 text-center ${
                  order === 1 ? 'sm:scale-105' : ''
                }`}
              >
                <p className="text-2xl sm:text-3xl mb-1">{medal}</p>
                <p className="font-semibold text-white text-xs sm:text-sm leading-tight">
                  {r.drivers?.given_name} {r.drivers?.family_name}
                </p>
                <p className="text-[11px] sm:text-xs text-neutral-400">{r.constructors?.name}</p>
              </div>
            )
          })}
        </div>
      )}

      {fastestLap && (
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-sm">
          ⏱️ Giro veloce: <strong>{fastestLap.drivers?.given_name} {fastestLap.drivers?.family_name}</strong> (
          {fastestLap.constructors?.name}) — {fastestLap.fastest_lap_time}
          {fastestLap.fastest_lap_avg_speed !== null && ` (${fastestLap.fastest_lap_avg_speed} km/h media)`}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className="rounded-lg border border-white/10 bg-[#15171c] p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Pole position</p>
          <p className="text-sm font-semibold text-white truncate">
            {poleResult ? `${poleResult.drivers?.given_name ?? ''} ${poleResult.drivers?.family_name ?? ''}` : '-'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#15171c] p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Miglior rimonta</p>
          <p className="text-sm font-semibold text-white truncate">
            {bestRecovery ? `${bestRecovery.name} (+${bestRecovery.gained})` : '-'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#15171c] p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Giri totali</p>
          <p className="text-sm font-semibold text-white">{totalLaps || '-'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#15171c] p-3">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Ritiri</p>
          <p className="text-sm font-semibold text-white">{retirements}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">Risultati gara</h2>
          <div className="rounded-lg border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Pos</th>
                  <th className="text-left px-3 py-2">Pilota</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-right px-3 py-2">Griglia</th>
                  <th className="text-right px-3 py-2">+/-</th>
                  <th className="text-right px-3 py-2">Giri</th>
                  <th className="text-left px-3 py-2">Stato</th>
                  <th className="text-right px-3 py-2">Punti</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const delta = positionDelta(r.grid, r.position)
                  return (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-3 py-1.5 text-neutral-400">{r.position_text ?? r.position ?? '-'}</td>
                      <td className="px-3 py-1.5 text-white">
                        {r.drivers?.given_name} {r.drivers?.family_name}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-400">{r.constructors?.name}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-400">{r.grid ?? '-'}</td>
                      <td
                        className={`px-3 py-1.5 text-right font-medium ${
                          delta === null ? 'text-neutral-500' : delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-neutral-500'
                        }`}
                      >
                        {delta === null ? '-' : delta > 0 ? `+${delta}` : delta}
                      </td>
                      <td className="px-3 py-1.5 text-right text-neutral-400">{r.laps ?? '-'}</td>
                      <td className="px-3 py-1.5 text-neutral-400">{r.status ?? '-'}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-300">{r.points}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">
            Classifica piloti dopo la gara
          </h2>
          <div className="rounded-lg border border-white/10 overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Pos</th>
                  <th className="text-left px-3 py-2">Pilota</th>
                  <th className="text-right px-3 py-2">Punti</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="px-3 py-1.5 text-neutral-400">{s.position}</td>
                    <td className="px-3 py-1.5 text-white">
                      {s.drivers?.given_name} {s.drivers?.family_name}
                    </td>
                    <td className="px-3 py-1.5 text-right text-neutral-300">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {constructorStandings.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">
                Classifica costruttori dopo la gara
              </h2>
              <div className="rounded-lg border border-white/10 overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Pos</th>
                      <th className="text-left px-3 py-2">Team</th>
                      <th className="text-right px-3 py-2">Vittorie</th>
                      <th className="text-right px-3 py-2">Punti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constructorStandings.map((s) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-3 py-1.5 text-neutral-400">{s.position}</td>
                        <td className="px-3 py-1.5 text-white">{s.constructors?.name}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-400">{s.wins}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-300">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {qualifying.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">Qualifiche</h2>
              <div className="rounded-lg border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Pos</th>
                      <th className="text-left px-3 py-2">Pilota</th>
                      <th className="text-right px-3 py-2">Q1</th>
                      <th className="text-right px-3 py-2">Q2</th>
                      <th className="text-right px-3 py-2">Q3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualifying.map((q) => (
                      <tr key={q.id} className="border-t border-white/5">
                        <td className="px-3 py-1.5 text-neutral-400">{q.position}</td>
                        <td className="px-3 py-1.5 text-white">
                          {q.drivers?.given_name} {q.drivers?.family_name}
                        </td>
                        <td className="px-3 py-1.5 text-right text-neutral-400 font-mono">{q.q1 ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-400 font-mono">{q.q2 ?? '-'}</td>
                        <td className="px-3 py-1.5 text-right text-neutral-300 font-mono">{q.q3 ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {ideas.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">
            Idee di post per questa gara
          </h2>
          <div className="flex flex-wrap gap-2">
            {ideas.map((idea) => {
              const meta = ideaMeta(idea.idea_type)
              return (
                <Link
                  key={idea.id}
                  to="/"
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-red-500/50 text-neutral-300"
                >
                  {meta.emoji} {idea.title}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
