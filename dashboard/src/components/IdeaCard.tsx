import type { ContentIdea } from '../lib/types'
import { ideaMeta } from '../lib/ideaMeta'

export default function IdeaCard({
  idea,
  onClick,
}: {
  idea: ContentIdea
  onClick: () => void
}) {
  const meta = ideaMeta(idea.idea_type)
  const preview = (idea.caption ?? '').split('\n').filter(Boolean)[0] ?? ''

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-[#15171c] border border-white/10 rounded-lg p-3 hover:border-red-500/60 hover:bg-[#1a1c22] transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          {meta.emoji} {meta.label}
        </span>
        {idea.source === 'auto' && (
          <span className="text-[10px] text-neutral-500">auto</span>
        )}
      </div>
      <div className="font-semibold text-sm text-neutral-100 mb-1 group-hover:text-white">
        {idea.title}
      </div>
      <p className="text-xs text-neutral-400 line-clamp-2">{preview}</p>
      {idea.hashtags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {idea.hashtags.slice(0, 3).map((h) => (
            <span key={h} className="text-[10px] text-red-400">
              #{h}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
