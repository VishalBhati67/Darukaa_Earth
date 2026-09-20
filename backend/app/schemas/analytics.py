from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Performance record schemas
# ============================================================================

class PerformanceBase(BaseModel):
    recorded_at: datetime
    carbon_value: float = Field(..., ge=0, description="Tons of CO2 (>= 0)")
    biodiversity_score: float = Field(
        ..., ge=0, le=100,
        description="Biodiversity score (0-100)"
    )
    notes: Optional[str] = None


class PerformanceCreate(PerformanceBase):
    """Schema for creating a new performance record."""
    pass


class PerformanceUpdate(BaseModel):
    """Schema for updating a performance record. All fields optional."""
    recorded_at: Optional[datetime] = None
    carbon_value: Optional[float] = Field(None, ge=0)
    biodiversity_score: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class PerformanceResponse(PerformanceBase):
    """Schema for returning a single performance record."""
    id: int
    site_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Historical performance point (for chart data)
# ============================================================================

class HistoricalPerformancePoint(BaseModel):
    """Single time-series data point for charts."""
    recorded_at: datetime
    carbon_value: float
    biodiversity_score: float


# ============================================================================
# Site analytics
# ============================================================================

class SiteAnalyticsResponse(BaseModel):
    """
    Aggregated analytics for a single site, including baseline/current/target
    metrics and full historical time series for charts.
    """
    site_id: int
    site_name: str
    project_id: int
    area_hectares: Optional[float] = None

    carbon_baseline: float
    carbon_current: float
    carbon_target: float
    carbon_progress_percent: float

    biodiversity_score_current: float
    biodiversity_target: float
    biodiversity_progress_percent: float

    historical_performance: List[HistoricalPerformancePoint]

    # Automated monitoring signals derived from persisted performance data.
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    alerts: List[str]
    insights: List[str]


# ============================================================================
# Project analytics
# ============================================================================

class ProjectSiteSummary(BaseModel):
    """Per-site summary within a project analytics response."""
    site_id: int
    site_name: str
    carbon_current: float
    biodiversity_score: Optional[float] = None
    has_performance: bool = False


class ProjectAnalyticsResponse(BaseModel):
    """
    Aggregated analytics for a project, combining all site-level metrics.
    """
    project_id: int
    project_name: str

    total_sites: int
    total_area_hectares: float

    carbon_total_current: float
    carbon_target: float
    carbon_progress_percent: float

    biodiversity_avg_current: float
    biodiversity_target: float
    biodiversity_progress_percent: float

    sites: List[ProjectSiteSummary]