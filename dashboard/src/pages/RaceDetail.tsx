import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ContentIdea, DriverStanding, QualifyingResult, Race, Result } from '../lib/types'
import { ideaMeta } from '../lib/ideaMeta'

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>()
  const [race, setRace] = useState<Race | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [qualifying, setQualifying] = useState<QualifyingResult[]>([])
  const [standings, setStandings] = useState<DriverStanding[]>([])
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
      supabase.from('content_ideas').select('*').eq('race_id', raceId).order('created_at', { ascending: false }),
    ])
      .then(([r, res, qual, stand, contentIdeas]) => {
        if (r.error) throw r.error
        setRace(r.data as Race)
        setResults((res.data ?? []) as Result[])
        setQualifying((qual.data ?? []) as QualifyingResult[])
        setStandings((stand.data ?? []) as DriverStanding[])
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
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[podium[1], podium[0], podium[2]].map((r, i) => {
            const order = [2, 1, 3][i]
            const medal = order === 1 ? '🥇' : order === 2 ? '🥈' : '🥉'
            return (
              <div
                key={r.id}
                className={`rounded-lg border border-white/10 bg-[#15171c] p-4 text-center ${
                  order === 1 ? 'sm:scale-105' : ''
                }`}
              >
                <p className="text-3xl mb-1">{medal}</p>
                <p className="font-semibold text-white text-sm">
                  {r.drivers?.given_name} {r.drivers?.family_name}
                </p>
                <p className="text-xs text-neutral-400">{r.constructors?.name}</p>
              </div>
            )
          })}
        </div>
      )}

      {fastestLap && (
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-sm">
          ⏱️ Giro veloce: <strong>{fastestLap.drivers?.given_name} {fastestLap.drivers?.family_name}</strong> (
          {fastestLap.constructors?.name}) — {fastestLap.fastest_lap_time}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">Risultati gara</h2>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Pos</th>
                  <th className="text-left px-3 py-2">Pilota</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-right px-3 py-2">Punti</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="px-3 py-1.5 text-neutral-400">{r.position_text ?? r.position ?? '-'}</td>
                    <td className="px-3 py-1.5 text-white">
                      {r.drivers?.given_name} {r.drivers?.family_name}
                    </td>
                    <td className="px-3 py-1.5 text-neutral-400">{r.constructors?.name}</td>
                    <td className="px-3 py-1.5 text-right text-neutral-300">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">
            Classifica piloti dopo la gara
          </h2>
          <div className="rounded-lg border border-white/10 overflow-hidden mb-6">
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

          {qualifying.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-2">Qualifiche</h2>
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-neutral-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Pos</th>
                      <th className="text-left px-3 py-2">Pilota</th>
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
                        <td className="px-3 py-1.5 text-right text-neutral-300 font-mono">
                          {q.q3 ?? q.q2 ?? q.q1 ?? '-'}
                        </td>
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
