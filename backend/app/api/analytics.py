from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.site import Site
from app.models.project import Project
from app.models.performance import Performance
from app.schemas.analytics import (
    PerformanceCreate,
    PerformanceUpdate,
    PerformanceResponse,
    SiteAnalyticsResponse,
    HistoricalPerformancePoint,
    ProjectAnalyticsResponse,
    ProjectSiteSummary,
)
from app.api.auth import get_current_user
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.services.analytics_metrics import (
    average_biodiversity,
    compute_progress,
    site_metric_snapshot,
)

router = APIRouter(tags=["Analytics"])


# ============================================================================
# Helpers
# ============================================================================

def _get_site_or_404(site_id: int, db: Session) -> Site:
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with id {site_id} not found",
        )
    return site


def _get_performance_or_404(performance_id: int, db: Session) -> Performance:
    record = db.query(Performance).filter(Performance.id == performance_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance record with id {performance_id} not found",
        )
    return record


def _latest_performance_for_site(site_id: int, db: Session) -> Optional[Performance]:
    """Return the most recent performance record for a site, or None."""
    return (
        db.query(Performance)
        .filter(Performance.site_id == site_id)
        .order_by(Performance.recorded_at.desc())
        .first()
    )


def _earliest_performance_for_site(site_id: int, db: Session) -> Optional[Performance]:
    """Return the earliest performance record for a site, or None."""
    return (
        db.query(Performance)
        .filter(Performance.site_id == site_id)
        .order_by(Performance.recorded_at.asc())
        .first()
    )


# ============================================================================
# SITE ANALYTICS
# ============================================================================

@router.get(
    "/api/sites/{site_id}/analytics",
    response_model=SiteAnalyticsResponse,
)
def get_site_analytics(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return aggregated analytics for a single site, including historical
    performance time series suitable for Chart.js / Highcharts rendering.
    """
    site = _get_site_or_404(site_id, db)
    project = site.project

    # Historical records ordered chronologically
    records = (
        db.query(Performance)
        .filter(Performance.site_id == site_id)
        .order_by(Performance.recorded_at.asc())
        .all()
    )

    earliest = records[0] if records else None
    latest = records[-1] if records else None

    carbon_baseline = earliest.carbon_value if earliest else 0.0
    carbon_current = latest.carbon_value if latest else 0.0
    carbon_target = float(project.carbon_target or 0.0)

    biodiversity_current = latest.biodiversity_score if latest else 0.0
    biodiversity_target = float(project.biodiversity_target or 0.0)

    # Automated monitoring signals: transparent rule-based indicators, not a predictive model.
    alerts: List[str] = []
    insights: List[str] = []
    risk_score = 0

    if not records:
        risk_score += 40
        alerts.append("No performance data has been recorded for this site.")
        insights.append("Add an initial performance record to establish a baseline.")
    else:
        if latest and (datetime.now(timezone.utc) - latest.recorded_at).days > 30:
            risk_score += 25
            alerts.append("Performance monitoring is more than 30 days old.")
            insights.append("Schedule a fresh site measurement to keep monitoring current.")

        if len(records) >= 2:
            previous = records[-2]
            if previous.biodiversity_score > 0:
                biodiversity_change = ((latest.biodiversity_score - previous.biodiversity_score) / previous.biodiversity_score) * 100
                if biodiversity_change <= -10:
                    risk_score += 35
                    alerts.append("Biodiversity score has declined by 10% or more since the previous reading.")
                    insights.append("Review recent site conditions and increase monitoring frequency.")
                elif biodiversity_change >= 10:
                    insights.append("Biodiversity score has improved by 10% or more since the previous reading.")

            if previous.carbon_value > 0:
                carbon_change = ((latest.carbon_value - previous.carbon_value) / previous.carbon_value) * 100
                if carbon_change <= -10:
                    risk_score += 30
                    alerts.append("Carbon metric has declined by 10% or more since the previous reading.")
                    insights.append("Review the latest carbon measurement and investigate the change.")
                elif carbon_change >= 10:
                    insights.append("Carbon metric has improved by 10% or more since the previous reading.")

    risk_score = min(risk_score, 100)
    risk_level = "High" if risk_score >= 60 else "Medium" if risk_score >= 30 else "Low"

    historical = [
        HistoricalPerformancePoint(
            recorded_at=r.recorded_at,
            carbon_value=r.carbon_value,
            biodiversity_score=r.biodiversity_score,
        )
        for r in records
    ]

    return SiteAnalyticsResponse(
        site_id=site.id,
        site_name=site.name,
        project_id=site.project_id,
        area_hectares=site.area_hectares,
        carbon_baseline=carbon_baseline,
        carbon_current=carbon_current,
        carbon_target=carbon_target,
        carbon_progress_percent=compute_progress(carbon_current, carbon_target),
        biodiversity_score_current=biodiversity_current,
        biodiversity_target=biodiversity_target,
        biodiversity_progress_percent=compute_progress(
            biodiversity_current, biodiversity_target
        ),
        historical_performance=historical,
        risk_score=risk_score,
        risk_level=risk_level,
        alerts=alerts,
        insights=insights,
    )


# ============================================================================
# SITE PERFORMANCE RECORDS (CRUD)
# ============================================================================

@router.get(
    "/api/sites/{site_id}/performance",
    response_model=list[PerformanceResponse],
)
def list_site_performance(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all persisted performance records for a site, chronological."""
    _get_site_or_404(site_id, db)

    records = (
        db.query(Performance)
        .filter(Performance.site_id == site_id)
        .order_by(Performance.recorded_at.asc())
        .all()
    )
    return records


@router.post(
    "/api/sites/{site_id}/performance",
    response_model=PerformanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_site_performance(
    site_id: int,
    payload: PerformanceCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new performance record for a site. Admin only."""
    _get_site_or_404(site_id, db)

    record = Performance(
        site_id=site_id,
        recorded_at=payload.recorded_at,
        carbon_value=payload.carbon_value,
        biodiversity_score=payload.biodiversity_score,
        notes=payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put(
    "/api/performance/{performance_id}",
    response_model=PerformanceResponse,
)
def update_performance(
    performance_id: int,
    payload: PerformanceUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update an existing performance record. Admin only."""
    record = _get_performance_or_404(performance_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete(
    "/api/performance/{performance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_performance(
    performance_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a performance record. Admin only."""
    record = _get_performance_or_404(performance_id, db)
    db.delete(record)
    db.commit()
    return None


# ============================================================================
# PROJECT ANALYTICS
# ============================================================================

@router.get(
    "/api/projects/{project_id}/analytics",
    response_model=ProjectAnalyticsResponse,
)
def get_project_analytics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregate analytics across all sites in a project.
    Returns project-level totals and per-site summaries.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found",
        )

    sites = db.query(Site).filter(Site.project_id == project_id).all()

    total_sites = len(sites)
    total_area_hectares = sum(float(s.area_hectares or 0.0) for s in sites)

    site_summaries: List[ProjectSiteSummary] = []
    carbon_total_current = 0.0
    biodiversity_scores: List[float] = []

    for site in sites:
        latest = _latest_performance_for_site(site.id, db)
        carbon_current, biodiversity_current = site_metric_snapshot(latest)

        carbon_total_current += carbon_current
        if biodiversity_current is not None:
            biodiversity_scores.append(biodiversity_current)

        site_summaries.append(
            ProjectSiteSummary(
                site_id=site.id,
                site_name=site.name,
                carbon_current=carbon_current,
                biodiversity_score=biodiversity_current,
                has_performance=latest is not None,
            )
        )

    biodiversity_avg_current = _average_biodiversity(biodiversity_scores)

    carbon_target = float(project.carbon_target or 0.0)
    biodiversity_target = float(project.biodiversity_target or 0.0)

    return ProjectAnalyticsResponse(
        project_id=project.id,
        project_name=project.name,
        total_sites=total_sites,
        total_area_hectares=total_area_hectares,
        carbon_total_current=carbon_total_current,
        carbon_target=carbon_target,
        carbon_progress_percent=_compute_progress(carbon_total_current, carbon_target),
        biodiversity_avg_current=biodiversity_avg_current,
        biodiversity_target=biodiversity_target,
        biodiversity_progress_percent=_compute_progress(
            biodiversity_avg_current, biodiversity_target
        ),
        sites=site_summaries,
    )