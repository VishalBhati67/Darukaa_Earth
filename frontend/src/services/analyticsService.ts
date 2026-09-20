import api from './api'
import type { PerformanceCreate, PerformanceRecord, SiteAnalytics } from '../types/analytics'

export const analyticsService = {
  async getSiteAnalytics(siteId: number): Promise<SiteAnalytics> {
    const response = await api.get<SiteAnalytics>(`/sites/${siteId}/analytics`)
    return response.data
  },

  async getSitePerformance(siteId: number): Promise<PerformanceRecord[]> {
    const response = await api.get<PerformanceRecord[]>(`/sites/${siteId}/performance`)
    return response.data
  },

  async createSitePerformance(siteId: number, data: PerformanceCreate): Promise<PerformanceRecord> {
    const response = await api.post<PerformanceRecord>(`/sites/${siteId}/performance`, data)
    return response.data
  },

  async deletePerformance(performanceId: number): Promise<void> {
    await api.delete(`/performance/${performanceId}`)
  },
}
