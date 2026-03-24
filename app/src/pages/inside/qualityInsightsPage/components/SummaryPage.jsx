import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';
import { NavLink } from 'redux-first-router-link';
import { PROJECT_LAUNCHES_PAGE, TEST_ITEM_PAGE } from 'controllers/pages';
import { ALL } from 'common/constants/reservedFilterIds';

const cx = classNames.bind(styles);

const SummaryPage = ({ projectId, data }) => {
  const db = data.summaryDashboard;
  const sprint = db.activeSprint;
  const health = db.qualityHealth;
  const trendMax = Math.max(...data.summaryTrend, 1);
  const sprintTrendMax = Math.max(...sprint.trendValues, 1);

  const totalLaunches = data.launches?.length || 0;
  const passedLaunches = data.launches?.filter((l) => l.status === 'PASSED').length || 0;
  const totalTests = data.launches?.reduce((s, l) => s + (l.statistics?.executions?.total || 0), 0) || 0;
  const totalFailed = data.launches?.reduce((s, l) => s + (l.statistics?.executions?.failed || 0), 0) || 0;
  const passRate = totalTests > 0 ? ((totalTests - totalFailed) / totalTests * 100).toFixed(1) : 0;
  const prevPassRate = totalLaunches > 1
    ? (() => {
        const prevLaunches = data.launches.slice(1);
        const prevTotal = prevLaunches.reduce((s, l) => s + (l.statistics?.executions?.total || 0), 0);
        const prevFailed = prevLaunches.reduce((s, l) => s + (l.statistics?.executions?.failed || 0), 0);
        return prevTotal > 0 ? ((prevTotal - prevFailed) / prevTotal * 100).toFixed(1) : 0;
      })()
    : passRate;
  const passRateDelta = (passRate - prevPassRate).toFixed(1);
  const flakyCount = data.flakyTests?.length || 0;
  const clusterCount = data.clusters?.length || 0;
  const novelCount = data.launches?.reduce((s, l) => {
    const d = l.statistics?.defects || {};
    return s + (d.to_investigate?.total || 0);
  }, 0) || 0;

  const summaryTiles = [
    {
      label: 'Pass rate',
      value: `${passRate}%`,
      note: passRateDelta >= 0 ? `▲ ${Math.abs(passRateDelta)}% vs previous` : `▼ ${Math.abs(passRateDelta)}% vs previous`,
      tone: Number(passRate) >= 80 ? 'success' : Number(passRate) >= 50 ? 'warning' : 'danger',
      accent: '#1d9e75',
      url: { type: PROJECT_LAUNCHES_PAGE, payload: { projectId, filterId: ALL } },
    },
    {
      label: 'Open failures',
      value: String(totalFailed),
      note: totalFailed > 0
        ? `${totalFailed} new since last run`
        : 'No open failures',
      tone: totalFailed > 0 ? 'danger' : 'success',
      accent: '#e8594a',
      url: { type: PROJECT_LAUNCHES_PAGE, payload: { projectId, filterId: ALL }, meta: { query: { 'filter.eq.status': 'FAILED' } } },
    },
    {
      label: 'Flaky tests',
      value: String(flakyCount),
      note: flakyCount > 0
        ? `▼ ${health.flakinessRate}% flakiness rate`
        : 'No flaky tests detected',
      tone: flakyCount > 0 ? 'warning' : 'success',
      accent: '#ef9f27',
      url: { type: PROJECT_LAUNCHES_PAGE, payload: { projectId, filterId: ALL }, meta: { query: { 'filter.ex.flaky': 'true' } } },
    },
    {
      label: 'Failure clusters',
      value: String(clusterCount),
      note: novelCount > 0
        ? `ML · ${novelCount} novel patterns`
        : 'ML · no novel patterns',
      tone: 'info',
      accent: '#7b61ff',
      url: { type: PROJECT_LAUNCHES_PAGE, payload: { projectId, filterId: ALL } },
    },
  ];

  return (
    <>
      <div className={cx('summary-tiles')}>
        {summaryTiles.map((tile) => (
          <NavLink key={tile.label} to={tile.url} className={cx('summary-tile')} style={{ borderLeftColor: tile.accent, textDecoration: 'none', color: 'inherit' }}>
            <div className={cx('summary-tile-label')}>{tile.label}</div>
            <div className={cx('summary-tile-value')}>{tile.value}</div>
            <div className={cx('summary-tile-note')} style={{ color: tile.accent }}>{tile.note}</div>
          </NavLink>
        ))}
      </div>

      <div className={cx('summary-bottom')}>
        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div>
              <div className={cx('summary-panel-label')}>Pass rate</div>
              <div className={cx('summary-panel-big')}>last {data.summaryTrend.length} launches</div>
            </div>
            <div className={cx('summary-panel-right')}>
              <div className={cx('hint')} style={{ color: 'rgba(255,255,255,0.5)' }}>launch-scoped</div>
              <Badge tone="success">{db.passRateAvg}</Badge>
            </div>
          </div>
          <div className={cx('summary-chart-area')}>
            <svg className={cx('summary-line-chart')} viewBox={`0 0 ${data.summaryTrend.length * 80} 120`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d9e75" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1d9e75" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d={`M0,${120 - (data.summaryTrend[0] / trendMax) * 100} ${data.summaryTrend.map((v, i) => `L${i * 80},${120 - (v / trendMax) * 100}`).join(' ')} L${(data.summaryTrend.length - 1) * 80},120 L0,120 Z`}
                fill="url(#chartFill)"
              />
              <polyline
                points={data.summaryTrend.map((v, i) => `${i * 80},${120 - (v / trendMax) * 100}`).join(' ')}
                fill="none"
                stroke="#1d9e75"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className={cx('summary-chart-labels')}>
              {db.trendLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div className={cx('summary-panel-label')}>Quality health</div>
            <div className={cx('hint')} style={{ color: 'rgba(255,255,255,0.5)' }}>this sprint</div>
          </div>
          <div className={cx('summary-donuts')}>
            <div className={cx('summary-donut-item')}>
              <DonutRing value={health.passRate} color="#1d9e75" />
              <div className={cx('summary-donut-val')}>{health.passRate}%</div>
              <div className={cx('summary-donut-label')}>Pass rate</div>
            </div>
            <div className={cx('summary-donut-item')}>
              <DonutRing value={health.flakinessRate} color="#9aa5b5" />
              <div className={cx('summary-donut-val')}>{health.flakinessRate}%</div>
              <div className={cx('summary-donut-label')}>Flakiness rate</div>
            </div>
            <div className={cx('summary-donut-item')}>
              <DonutRing value={health.failureRate} color="#e8594a" />
              <div className={cx('summary-donut-val')}>{health.failureRate}%</div>
              <div className={cx('summary-donut-label')}>Failure rate</div>
            </div>
          </div>
        </div>

        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div>
              <div className={cx('summary-panel-label')}>Active sprint</div>
            </div>
            <div className={cx('hint')} style={{ color: 'rgba(255,255,255,0.5)' }}>{sprint.version} · {sprint.name}</div>
          </div>
          <div className={cx('summary-sprint-body')}>
            <div className={cx('summary-sprint-section')}>
              <div className={cx('summary-sprint-progress-label')}>Sprint progress</div>
              <div className={cx('summary-sprint-progress-track')}>
                <div className={cx('summary-sprint-progress-fill')} style={{ width: `${sprint.progress}%` }} />
              </div>
              <div className={cx('hint')} style={{ color: 'rgba(255,255,255,0.4)' }}>{sprint.dates} · {sprint.dayLabel}</div>
            </div>
            <div className={cx('summary-sprint-stats')}>
              {sprint.stats.map(([label, value]) => (
                <div key={label} className={cx('summary-sprint-stat')}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className={cx('summary-sprint-section')}>
              <div className={cx('summary-sprint-progress-label')}>Sprint pass rate trend</div>
              <div className={cx('summary-mini-trend')}>
                {sprint.trendValues.map((v, i) => (
                  <NavLink
                    key={sprint.trendLabels[i]}
                    to={{ type: TEST_ITEM_PAGE, payload: { projectId, filterId: ALL, testItemIds: String(sprint.trendIds[i]) } }}
                    className={cx('summary-mini-bar')}
                    style={{ height: `${Math.max((v / sprintTrendMax) * 100, 8)}%`, display: 'block' }}
                    title={`${sprint.trendLabels[i]}: ${v}%`}
                  />
                ))}
              </div>
              <div className={cx('summary-chart-labels')}>
                {sprint.trendLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

SummaryPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
};

export default SummaryPage;
