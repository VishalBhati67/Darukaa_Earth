export type ProjectType = 'carbon' | 'biodiversity' | 'carbon_biodiversity'
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived'

export interface Project {
  id: number
  name: string
  description: string | null
  project_type: ProjectType
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  total_area: number | null
  carbon_target: number | null
  biodiversity_target: number | null
  created_at: string
  updated_at: string | null
}

export interface ProjectCreate {
  name: string
  description?: string | null
  project_type: ProjectType
  status?: ProjectStatus
  start_date?: string | null
  end_date?: string | null
  total_area?: number | null
  carbon_target?: number | null
  biodiversity_target?: number | null
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  project_type?: ProjectType
  status?: ProjectStatus
  start_date?: string | null
  end_date?: string | null
  total_area?: number | null
  carbon_target?: number | null
  biodiversity_target?: number | null
}

export interface SiteSummary {
  site_id: number
  site_name: string
  carbon_current: number
  biodiversity_score: number | null
  has_performance?: boolean
}

export interface ProjectAnalytics {
  project_id: number
  project_name: string
  total_sites: number
  total_area_hectares: number
  carbon_total_current: number
  carbon_target: number
  carbon_progress_percent: number
  biodiversity_avg_current: number
  biodiversity_target: number
  biodiversity_progress_percent: number
  sites: SiteSummary[]
}

export interface DashboardProject {
  project: Project
  analytics: ProjectAnalytics | null
}

export interface DashboardKPIs {
  totalProjects: number
  totalSites: number
  totalAreaHectares: number
  currentCarbon: number
  avgBiodiversityScore: number
}
