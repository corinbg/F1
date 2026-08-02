import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentIdea, Race } from '../lib/types'
import { IDEA_TYPE_META } from '../lib/ideaMeta'

export default function NewIdeaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (idea: ContentIdea) => void
}) {
  const [races, setRaces] = useState<Race[]>([])
  const [raceId, setRaceId] = useState<string>('')
  const [ideaType, setIdeaType] = useState('custom')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('F1, FormulaUno')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('races')
      .select('*')
      .order('race_date', { ascending: false })
      .limit(30)
      .then(({ data }) => setRaces((data ?? []) as Race[]))
  }, [])

  async function handleCreate() {
    if (!title.trim()) {
      setError('Il titolo è obbligatorio')
      return
    }
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('content_ideas')
      .insert({
        race_id: raceId || null,
        idea_type: ideaType,
        title,
        caption,
        hashtags: hashtags
          .split(',')
          .map((h) => h.trim().replace(/^#/, ''))
          .filter(Boolean),
        status: 'idea',
        source: 'manual',
      })
      .select('*, races(name, race_date)')
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    onCreated(data as ContentIdea)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#101216] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Nuova idea di post</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Gara collegata (opzionale)</label>
          <select
            value={raceId}
            onChange={(e) => setRaceId(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">Nessuna</option>
            {races.map((r) => (
              <option key={r.race_id} value={r.race_id}>
                {r.name} ({r.season})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Tipo</label>
          <select
            value={ideaType}
            onChange={(e) => setIdeaType(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm"
          >
            {Object.entries(IDEA_TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.emoji} {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Titolo</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm"
            placeholder="Es. Anteprima GP Monza"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Hashtag (separati da virgola)</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm border border-white/10 text-neutral-300">
            Annulla
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white"
          >
            {saving ? 'Creazione…' : 'Crea idea'}
          </button>
        </div>
      </div>
    </div>
  )
}
