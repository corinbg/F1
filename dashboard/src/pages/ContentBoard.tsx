import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentIdea } from '../lib/types'
import { STATUS_COLUMNS } from '../lib/ideaMeta'
import IdeaCard from '../components/IdeaCard'
import IdeaEditor from '../components/IdeaEditor'
import NewIdeaModal from '../components/NewIdeaModal'

export default function ContentBoard() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContentIdea | null>(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('content_ideas')
        .select('*, races(name, race_date)')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
      if (err) throw err
      setIdeas((data ?? []) as ContentIdea[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossibile contattare Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(() => {
    const grouped: Record<string, ContentIdea[]> = {}
    for (const col of STATUS_COLUMNS) grouped[col.key] = []
    for (const idea of ideas) {
      if (grouped[idea.status]) grouped[idea.status].push(idea)
    }
    return grouped
  }, [ideas])

  function handleSaved(updated: ContentIdea) {
    setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setSelected(updated)
  }

  function handleDeleted(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    setSelected(null)
  }

  function handleCreated(created: ContentIdea) {
    setIdeas((prev) => [created, ...prev])
    setShowNew(false)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Idee per i post Instagram</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Generate automaticamente dai dati di gara, pronte da rifinire e pubblicare.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="self-start sm:self-auto shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white"
        >
          + Nuova idea
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {loading && <p className="text-sm text-neutral-400">Caricamento…</p>}

      {!loading && ideas.length === 0 && (
        <div className="text-center py-16 text-neutral-400 border border-dashed border-white/10 rounded-xl">
          <p className="text-lg mb-2">Nessuna idea ancora.</p>
          <p className="text-sm">
            Esegui il workflow n8n "F1 Content Idea Generator" oppure crea un'idea manualmente.
          </p>
        </div>
      )}

      {!loading && ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {col.label}
                </h2>
                <span className="text-xs text-neutral-500">{columns[col.key]?.length ?? 0}</span>
              </div>
              <div className="flex flex-col gap-2 bg-black/20 rounded-xl p-2 flex-1 border border-white/5">
                {columns[col.key]?.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} onClick={() => setSelected(idea)} />
                ))}
                {columns[col.key]?.length === 0 && (
                  <p className="text-xs text-neutral-600 text-center py-6">Vuoto</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <IdeaEditor
          idea={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {showNew && <NewIdeaModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  )
}
