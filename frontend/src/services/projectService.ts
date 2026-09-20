import api from './api'
import type {
  Project,
  ProjectAnalytics,
  DashboardProject,
  DashboardKPIs,
  ProjectCreate,
  ProjectUpdate,
} from '../types/dashboard'

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>('/projects')
    return response.data
  },

  async getProjectAnalytics(projectId: number): Promise<ProjectAnalytics> {
    const response = await api.get<ProjectAnalytics>(`/projects/${projectId}/analytics`)
    return response.data
  },
  async getProject(projectId: number): Promise<Project> {
    const response = await api.get<Project>(`/projects/${projectId}`)
    return response.data
  },

  async getDashboardData(): Promise<{ projects: DashboardProject[]; kpis: DashboardKPIs }> {
    const projects = await this.getProjects()

    const analyticsPromises = projects.map(async (project) => {
      try {
        const analytics = await this.getProjectAnalytics(project.id)
        return { project, analytics }
      } catch (error) {
        console.warn(`Failed to fetch analytics for project ${project.id}`, error)
        return { project, analytics: null }
      }
    })

    const dashboardProjects = await Promise.all(analyticsPromises)

    let totalSites = 0
    let totalAreaHectares = 0
    let currentCarbon = 0
    const latestBiodiversityScores: number[] = []

    for (const dp of dashboardProjects) {
      if (dp.analytics) {
        totalSites += dp.analytics.total_sites
        totalAreaHectares += dp.analytics.total_area_hectares
        currentCarbon += dp.analytics.carbon_total_current

        for (const site of dp.analytics.sites) {
          if (site.has_performance && site.biodiversity_score != null) {
            latestBiodiversityScores.push(site.biodiversity_score)
          }
        }
      }
    }

    const avgBiodiversityScore =
      latestBiodiversityScores.length > 0
        ? latestBiodiversityScores.reduce((sum, score) => sum + score, 0) /
          latestBiodiversityScores.length
        : 0

    const kpis: DashboardKPIs = {
      totalProjects: projects.length,
      totalSites,
      totalAreaHectares,
      currentCarbon,
      avgBiodiversityScore,
    }

    return { projects: dashboardProjects, kpis }
  },

  async createProject(data: ProjectCreate): Promise<Project> {
    const response = await api.post<Project>('/projects', data)
    return response.data
  },

  async updateProject(projectId: number, data: ProjectUpdate): Promise<Project> {
    const response = await api.put<Project>(`/projects/${projectId}`, data)
    return response.data
  },

  async deleteProject(projectId: number): Promise<void> {
    await api.delete(`/projects/${projectId}`)
  },
}
