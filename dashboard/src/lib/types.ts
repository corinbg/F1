export type RaceStatus = 'upcoming' | 'completed'

export interface Race {
  race_id: string
  season: number
  round: number
  name: string
  circuit_name: string | null
  country: string | null
  locality: string | null
  race_date: string | null
  race_time: string | null
  status: RaceStatus
}

export interface Driver {
  driver_id: string
  code: string | null
  permanent_number: number | null
  given_name: string
  family_name: string
  nationality: string | null
  current_constructor_id: string | null
}

export interface Constructor {
  constructor_id: string
  name: string
  nationality: string | null
  color: string | null
}

export interface Result {
  id: number
  race_id: string
  driver_id: string
  constructor_id: string | null
  grid: number | null
  position: number | null
  position_text: string | null
  points: number
  status: string | null
  laps: number | null
  fastest_lap_rank: number | null
  fastest_lap_time: string | null
  drivers?: Pick<Driver, 'given_name' | 'family_name' | 'code'>
  constructors?: Pick<Constructor, 'name' | 'color'>
}

export interface QualifyingResult {
  id: number
  race_id: string
  driver_id: string
  constructor_id: string | null
  position: number | null
  q1: string | null
  q2: string | null
  q3: string | null
  drivers?: Pick<Driver, 'given_name' | 'family_name' | 'code'>
  constructors?: Pick<Constructor, 'name' | 'color'>
}

export interface DriverStanding {
  id: number
  race_id: string
  driver_id: string
  position: number | null
  points: number
  wins: number
  drivers?: Pick<Driver, 'given_name' | 'family_name' | 'code' | 'current_constructor_id'>
}

export interface ConstructorStanding {
  id: number
  race_id: string
  constructor_id: string
  position: number | null
  points: number
  wins: number
  constructors?: Pick<Constructor, 'name' | 'color'>
}

export type IdeaStatus = 'idea' | 'draft' | 'scheduled' | 'posted' | 'archived'
export type IdeaType =
  | 'podium'
  | 'fastest_lap'
  | 'comeback'
  | 'drama'
  | 'standings'
  | 'battle'
  | 'milestone'
  | 'preview'
  | 'on_this_day'
  | 'custom'

export interface ContentIdea {
  id: string
  race_id: string | null
  idea_type: IdeaType | string
  title: string
  caption: string | null
  hashtags: string[]
  stats: Record<string, unknown>
  status: IdeaStatus
  priority: number
  scheduled_for: string | null
  source: 'auto' | 'manual'
  created_at: string
  updated_at: string
  races?: Pick<Race, 'name' | 'race_date'>
}
