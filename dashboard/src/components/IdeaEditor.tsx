import { useEffect, useState } from 'react'
import type { ContentIdea, IdeaStatus } from '../lib/types'
import { supabase } from '../lib/supabase'
import InstagramPreview from './InstagramPreview'
import { ideaMeta } from '../lib/ideaMeta'

const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'draft', label: 'Bozza' },
  { value: 'scheduled', label: 'Programmato' },
  { value: 'posted', label: 'Pubblicato' },
  { value: 'archived', label: 'Archiviato' },
]

export default function IdeaEditor({
  idea,
  onClose,
  onSaved,
  onDeleted,
}: {
  idea: ContentIdea
  onClose: () => void
  onSaved: (updated: ContentIdea) => void
  onDeleted: (id: string) => void
}) {
  const [title, setTitle] = useState(idea.title)
  const [caption, setCaption] = useState(idea.caption ?? '')
  const [hashtags, setHashtags] = useState(idea.hashtags?.join(', ') ?? '')
  const [status, setStatus] = useState<IdeaStatus>(idea.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(idea.title)
    setCaption(idea.caption ?? '')
    setHashtags(idea.hashtags?.join(', ') ?? '')
    setStatus(idea.status)
  }, [idea])

  const previewIdea: ContentIdea = {
    ...idea,
    title,
    caption,
    hashtags: hashtags
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean),
    status,
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('content_ideas')
      .update({
        title,
        caption,
        hashtags: previewIdea.hashtags,
        status,
      })
      .eq('id', idea.id)
      .select('*, races(name, race_date)')
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    onSaved(data as ContentIdea)
  }

  async function handleDelete() {
    if (!confirm('Eliminare questa idea?')) return
    const { error: err } = await supabase.from('content_ideas').delete().eq('id', idea.id)
    if (err) {
      setError(err.message)
      return
    }
    onDeleted(idea.id)
  }

  const meta = ideaMeta(idea.idea_type)

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-[#101216] border-l border-white/10 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            {meta.emoji} {meta.label}
          </span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-sm">
            Chiudi ✕
          </button>
        </div>

        <InstagramPreview idea={previewIdea} />

        <div>
          <label className="text-xs font-medium text-neutral-400">Titolo</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm font-mono whitespace-pre-wrap focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Hashtag (separati da virgola)</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1c22] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {previewIdea.hashtags.map((h) => (
              <span key={h} className="text-[11px] text-red-400">
                #{h}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Stato</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  status === opt.value
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-white/10 text-neutral-300 hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
          <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300">
            Elimina
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(caption + '\n\n' + previewIdea.hashtags.map((h) => '#' + h).join(' '))
              }}
              className="px-3 py-2 rounded-lg text-sm border border-white/10 text-neutral-200 hover:bg-white/5"
            >
              Copia testo
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white"
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
