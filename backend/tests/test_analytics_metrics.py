from types import SimpleNamespace

from app.api.analytics import _average_biodiversity, _site_metric_snapshot


def test_missing_performance_does_not_count_as_zero_biodiversity():
    carbon, biodiversity = _site_metric_snapshot(None)

    assert carbon == 0.0
    assert biodiversity is None


def test_recorded_zero_biodiversity_is_kept():
    latest = SimpleNamespace(carbon_value=12.5, biodiversity_score=0.0)

    carbon, biodiversity = _site_metric_snapshot(latest)

    assert carbon == 12.5
    assert biodiversity == 0.0


def test_dashboard_style_average_ignores_sites_without_readings():
    snapshots = [
        _site_metric_snapshot(None),
        _site_metric_snapshot(SimpleNamespace(carbon_value=10.0, biodiversity_score=80.0)),
        _site_metric_snapshot(SimpleNamespace(carbon_value=5.0, biodiversity_score=60.0)),
    ]
    scores = [score for _, score in snapshots if score is not None]

    # Including missing sites as 0.0 would yield 46.6... instead of 70.0
    assert _average_biodiversity(scores) == 70.0
    assert _average_biodiversity([]) == 0.0
