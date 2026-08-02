import type { IdeaType } from './types'

export const IDEA_TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  podium: { label: 'Podio', emoji: '🏆', color: '#facc15' },
  fastest_lap: { label: 'Giro veloce', emoji: '⏱️', color: '#a855f7' },
  comeback: { label: 'Rimonta', emoji: '📈', color: '#22c55e' },
  drama: { label: 'Colpi di scena', emoji: '💥', color: '#ef4444' },
  standings: { label: 'Classifica', emoji: '📊', color: '#3b82f6' },
  battle: { label: 'Duello', emoji: '⚔️', color: '#f97316' },
  milestone: { label: 'Traguardo', emoji: '🎖️', color: '#14b8a6' },
  preview: { label: 'Anteprima GP', emoji: '📅', color: '#6366f1' },
  on_this_day: { label: 'Accadde oggi', emoji: '🕰️', color: '#ec4899' },
  custom: { label: 'Idea personalizzata', emoji: '✏️', color: '#94a3b8' },
}

export function ideaMeta(type: string) {
  return IDEA_TYPE_META[type as IdeaType] ?? IDEA_TYPE_META.custom
}

export const STATUS_COLUMNS: { key: string; label: string }[] = [
  { key: 'idea', label: 'Idee' },
  { key: 'draft', label: 'Bozza' },
  { key: 'scheduled', label: 'Programmato' },
  { key: 'posted', label: 'Pubblicato' },
]
