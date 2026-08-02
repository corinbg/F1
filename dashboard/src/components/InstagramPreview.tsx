import type { ContentIdea } from '../lib/types'
import { ideaMeta } from '../lib/ideaMeta'

function firstLine(caption: string | null): string {
  if (!caption) return ''
  return caption.split('\n').filter(Boolean)[0] ?? ''
}

export default function InstagramPreview({ idea }: { idea: ContentIdea }) {
  const meta = ideaMeta(idea.idea_type)
  const raceName = idea.races?.name ?? ''

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden relative shadow-lg border border-white/10">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 120% at 15% 10%, ${meta.color}55 0%, #0b0d10 55%)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded-full backdrop-blur">
            {meta.emoji} {meta.label}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">F1</span>
        </div>
        <div>
          {raceName && (
            <div className="text-[11px] uppercase tracking-wide text-white/60 mb-1">{raceName}</div>
          )}
          <div className="text-xl font-extrabold leading-tight text-white drop-shadow">
            {firstLine(idea.caption) || idea.title}
          </div>
        </div>
      </div>
    </div>
  )
}
