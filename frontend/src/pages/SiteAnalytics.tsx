import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  ArrowLeft,
  AlertCircle,
  Leaf,
  Target,
  TrendingUp,
  BarChart2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react'
import { analyticsService } from '../services/analyticsService'
import type { SiteAnalytics as SiteAnalyticsData } from '../types/analytics'
import { ProgressBar } from '../components/dashboard/ProgressBar'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const SiteAnalytics: React.FC = () => {
  const { siteId: siteIdParam } = useParams<{ siteId: string }>()
  const navigate = useNavigate()

  const [data, setData] = useState<SiteAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const id = parseInt(siteIdParam || '', 10)
    if (isNaN(id)) {
      setError('Invalid site ID.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await analyticsService.getSiteAnalytics(id)
      setData(result)
    } catch (err) {
      console.error('Failed to fetch site analytics:', err)
      setError('Unable to load site analytics. Please ensure the API server is running.')
    } finally {
      setLoading(false)
    }
  }, [siteIdParam])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Loading state ---
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/4 rounded bg-gray-200"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
          ))}
        </div>
        <div className="h-64 rounded-lg bg-gray-200"></div>
        <div className="h-64 rounded-lg bg-gray-200"></div>
      </div>
    )
  }

  // --- Error state ---
  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-medium text-red-900">Error</h3>
        <p className="mt-2 text-red-700">{error || 'Site not found.'}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center rounded-md border border-red-300 px-4 py-2 text-red-700 transition-colors hover:bg-red-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // --- Chart data ---
  const carbonChartData = {
    labels: data.historical_performance.map((p) => formatDate(p.recorded_at)),
    datasets: [
      {
        label: 'Carbon (t)',
        data: data.historical_performance.map((p) => p.carbon_value),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  const biodiversityChartData = {
    labels: data.historical_performance.map((p) => formatDate(p.recorded_at)),
    datasets: [
      {
        label: 'Biodiversity Score',
        data: data.historical_performance.map((p) => p.biodiversity_score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  const biodiversityChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Score (0-100)' },
      },
    },
  }

  // --- Main render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.site_name}</h1>
            <p className="mt-1 text-gray-600">
              Project ID: {data.project_id} •{' '}
              {data.area_hectares ? `Area: ${data.area_hectares.toFixed(2)} ha` : 'Area: N/A'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards — 5 cards including Site Area */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Site Area</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.area_hectares ? `${data.area_hectares.toFixed(2)} ha` : '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Mapped boundary</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Current Carbon
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.carbon_current.toLocaleString()} t
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Baseline: {data.carbon_baseline.toLocaleString()} t
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Carbon Target
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.carbon_target.toLocaleString()} t
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Progress: {data.carbon_progress_percent.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Biodiversity
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.biodiversity_score_current.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Target: {data.biodiversity_target}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Biodiversity Target
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.biodiversity_target}</p>
          <p className="mt-1 text-sm text-gray-500">
            Progress: {data.biodiversity_progress_percent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Environmental Intelligence */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Environmental Risk</h3>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {data.risk_level} · {data.risk_score}/100
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: \`\${Math.min(data.risk_score, 100)}%\` }}
            />
          </div>
          {data.alerts.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {data.alerts.map((alert, index) => (
                <li key={index} className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  {alert}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No current monitoring alerts.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Environmental Insights</h3>
          </div>
          {data.insights.length > 0 ? (
            <ul className="space-y-3">
              {data.insights.map((insight, index) => (
                <li key={index} className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                  {insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">More performance data is needed for insights.</p>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Carbon Progress</h3>
          <ProgressBar value={data.carbon_progress_percent} color="green" />
          <p className="mt-2 text-right text-sm text-gray-500">
            {data.carbon_progress_percent.toFixed(1)}% of {data.carbon_target.toLocaleString()} t
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Biodiversity Progress</h3>
          <ProgressBar value={data.biodiversity_progress_percent} color="blue" />
          <p className="mt-2 text-right text-sm text-gray-500">
            {data.biodiversity_progress_percent.toFixed(1)}% of {data.biodiversity_target}
          </p>
        </div>
      </div>

      {/* Historical Performance Charts */}
      {data.historical_performance.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BarChart2 className="h-5 w-5 text-emerald-600" />
              Carbon Sequestration Over Time
            </h3>
            <div className="h-64">
              <Line data={carbonChartData} options={chartOptions} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              Biodiversity Score Over Time
            </h3>
            <div className="h-64">
              <Line data={biodiversityChartData} options={biodiversityChartOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <BarChart2 className="mx-auto mb-2 h-10 w-10 text-gray-400" />
          <p className="font-medium text-gray-500">No historical performance data available yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Performance records will appear here once added.
          </p>
        </div>
      )}

      {/* Recent Performance Table */}
      {data.historical_performance.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Performance Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Carbon (t)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Biodiversity Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.historical_performance.map((record, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(record.recorded_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {record.carbon_value.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {record.biodiversity_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
