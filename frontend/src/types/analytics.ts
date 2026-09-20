export interface HistoricalPerformancePoint {
  recorded_at: string
  carbon_value: number
  biodiversity_score: number
}

export interface PerformanceRecord {
  id: number
  site_id: number
  recorded_at: string
  carbon_value: number
  biodiversity_score: number
  notes: string | null
  created_at: string
}

export interface PerformanceCreate {
  recorded_at: string
  carbon_value: number
  biodiversity_score: number
  notes?: string | null
}

export interface SiteAnalytics {
  site_id: number
  site_name: string
  project_id: number
  area_hectares: number | null
  carbon_baseline: number
  carbon_current: number
  carbon_target: number
  carbon_progress_percent: number
  biodiversity_score_current: number
  biodiversity_target: number
  biodiversity_progress_percent: number
  historical_performance: HistoricalPerformancePoint[]
  risk_score: number
  risk_level: string
  alerts: string[]
  insights: string[]
}
