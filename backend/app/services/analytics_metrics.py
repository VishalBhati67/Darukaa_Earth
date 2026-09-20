from typing import List, Optional, Tuple


def compute_progress(current: float, target: float) -> float:
    """Compute progress percentage, guarding against zero target."""
    if target and target > 0:
        return round((current / target) * 100, 2)
    return 0.0


def site_metric_snapshot(
    latest: Optional[object],
) -> Tuple[float, Optional[float]]:
    """
    Carbon can be summed with a missing reading as 0.0 (no contribution).
    Biodiversity cannot: a missing reading is not a score of 0.
    """
    if latest is None:
        return 0.0, None
    return float(latest.carbon_value), float(latest.biodiversity_score)


def average_biodiversity(scores: List[float]) -> float:
    if not scores:
        return 0.0
    return sum(scores) / len(scores)
