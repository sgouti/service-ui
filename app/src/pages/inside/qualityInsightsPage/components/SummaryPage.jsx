import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { NavLink } from 'redux-first-router-link';
import { PROJECT_QUALITY_INSIGHTS_PAGE } from 'controllers/pages';
import styles from '../qualityInsightsPage.scss';
import { Badge, ProgressBar, ResourceLink } from './ui';
import {
  CLUSTER_VIEW_SECTION,
  FAILURE_SEARCH_SECTION,
  FLAKINESS_SECTION,
  TRENDS_SECTION,
} from '../constants';

const cx = classNames.bind(styles);

const CHART_HEIGHT = 120;
const CHART_WIDTH_PER_POINT = 72;
const CHART_X_OFFSET = 28;
const CHART_Y_TICKS = [0, 25, 50, 75, 100];
const RESERVED_SUMMARY_ATTRIBUTE_KEYS = new Set(['build', 'env', 'environment', 'release', 'sprint']);

const buildInsightsLink = (projectId, insightSection) => ({
  type: PROJECT_QUALITY_INSIGHTS_PAGE,
  payload: {
    projectId,
    insightSection,
  },
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const getLaunchLabel = (launch) => {
  if (!launch) {
    return 'No execution';
  }

  const launchName = String(launch.name || 'Launch').trim() || 'Launch';
  return launch.number === undefined || launch.number === null ? launchName : `${launchName} #${launch.number}`;
};

const getLaunchName = (launch) => String(launch?.name || 'Launch').trim() || 'Launch';
const getLaunchNumberLabel = (launch) =>
  launch?.number === undefined || launch?.number === null ? 'No number' : `#${launch.number}`;

const getLaunchAttributes = (launch) => (Array.isArray(launch?.attributes) ? launch.attributes : []);

const getLaunchAttributeValue = (launch, keys) => {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const attribute = getLaunchAttributes(launch).find((item) => {
    const attributeKey = String(item?.key || '').trim().toLowerCase();
    const attributeValue = String(item?.value || '').trim();
    return keySet.has(attributeKey) && attributeValue;
  });

  return String(attribute?.value || '').trim();
};

const getLaunchEnvironment = (launch) => getLaunchAttributeValue(launch, ['env', 'environment']) || 'Unspecified';

const getLaunchTags = (launch) =>
  Array.from(
    new Set(
      getLaunchAttributes(launch)
        .filter((attribute) => {
          const key = String(attribute?.key || '').trim().toLowerCase();
          const value = String(attribute?.value || '').trim();
          return value && !RESERVED_SUMMARY_ATTRIBUTE_KEYS.has(key);
        })
        .map((attribute) => String(attribute.value).trim()),
    ),
  );

const getExecutionTotal = (launch) => launch?.statistics?.executions?.total || 0;
const getExecutionFailed = (launch) => launch?.statistics?.executions?.failed || 0;
const getExecutionPassed = (launch) => launch?.statistics?.executions?.passed || 0;

const getPassRate = (launch) => {
  const total = getExecutionTotal(launch);
  return total ? (getExecutionPassed(launch) / total) * 100 : 0;
};

const getFailureRate = (launch) => {
  const total = getExecutionTotal(launch);
  return total ? (getExecutionFailed(launch) / total) * 100 : 0;
};

const getStatusTone = (status) => {
  const normalizedStatus = String(status || '').toUpperCase();
  if (normalizedStatus === 'PASSED') {
    return 'success';
  }
  if (normalizedStatus === 'FAILED') {
    return 'danger';
  }
  if (normalizedStatus === 'SKIPPED') {
    return 'warning';
  }
  return 'neutral';
};

const formatDelta = (currentValue, previousValue, unit = '') => {
  if (previousValue === null || previousValue === undefined) {
    return { text: 'No previous execution', tone: 'neutral' };
  }

  const delta = Number(currentValue || 0) - Number(previousValue || 0);
  if (delta === 0) {
    return { text: `No change${unit ? ` ${unit}` : ''}`, tone: 'neutral' };
  }

  return {
    text: `${delta > 0 ? '+' : ''}${delta.toFixed(unit === 'tests' ? 0 : 1)}${unit ? ` ${unit}` : ''}`,
    tone: delta > 0 ? 'danger' : 'success',
  };
};

const formatDate = (value) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateRange = (launches) => {
  if (!launches.length) {
    return 'No execution window';
  }

  const orderedDates = launches
    .map((launch) => launch?.startTime)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (!orderedDates.length) {
    return 'Execution window unavailable';
  }

  return `${formatDate(orderedDates[0])} - ${formatDate(orderedDates[orderedDates.length - 1])}`;
};

const getFlakyCountForLaunch = (data, launchLabel) =>
  (data.flakyTests || []).filter((row) => String(row?.[5] || '') === launchLabel).length;

const getClusterCountForLaunch = (data, launchLabel) =>
  (data.clusters || []).filter((cluster) => String(cluster?.subtitle || '') === launchLabel).length;

const buildChartModel = (launches) => {
  const points = launches.map((launch, index) => {
    const passRate = getPassRate(launch);
    const x = CHART_X_OFFSET + index * CHART_WIDTH_PER_POINT;
    const y = CHART_HEIGHT - clamp(passRate, 0, 100);

    return {
      launch,
      label: getLaunchLabel(launch),
      launchName: getLaunchName(launch),
      launchNumberLabel: getLaunchNumberLabel(launch),
      shortLabel: launch?.number === undefined || launch?.number === null ? `Run ${index + 1}` : `#${launch.number}`,
      passRate,
      x,
      y,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = points.length
    ? `M${points[0].x},${points[0].y} ${points.map((point) => `L${point.x},${point.y}`).join(' ')} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`
    : '';

  return {
    width: Math.max(CHART_X_OFFSET + (points.length - 1) * CHART_WIDTH_PER_POINT + 28, 140),
    points,
    polylinePoints,
    areaPath,
  };
};

const SummaryPage = ({ projectId, data, scope }) => {
  const selectedLaunch = scope.selectedLaunch;
  const previousLaunch = scope.previousLaunch;
  const scopedLaunches = scope.windowLaunches || [];

  if (!selectedLaunch) {
    return (
      <div className={cx('summary-empty-state')}>
        <div className={cx('summary-empty-title')}>No executions match the current filters.</div>
        <div className={cx('summary-empty-copy')}>
          Adjust the date range, launch, tag, or environment filters to restore a Quick Summary view.
        </div>
      </div>
    );
  }

  const contextLaunches = (scope.contextLaunches || []).length ? [...scope.contextLaunches].reverse() : [selectedLaunch];
  const selectedLaunchLabel = getLaunchLabel(selectedLaunch);
  const previousLaunchLabel = previousLaunch ? getLaunchLabel(previousLaunch) : 'No previous execution';
  const selectedTotal = getExecutionTotal(selectedLaunch);
  const selectedPassed = getExecutionPassed(selectedLaunch);
  const selectedFailed = getExecutionFailed(selectedLaunch);
  const selectedPassRate = getPassRate(selectedLaunch);
  const selectedFailureRate = getFailureRate(selectedLaunch);
  const previousPassRate = previousLaunch ? getPassRate(previousLaunch) : null;
  const previousPassed = previousLaunch ? getExecutionPassed(previousLaunch) : null;
  const previousFailed = previousLaunch ? getExecutionFailed(previousLaunch) : null;
  const selectedFlakyCount = getFlakyCountForLaunch(data, selectedLaunchLabel);
  const previousFlakyCount = previousLaunch ? getFlakyCountForLaunch(data, previousLaunchLabel) : null;
  const selectedClusterCount = getClusterCountForLaunch(data, selectedLaunchLabel);
  const previousClusterCount = previousLaunch ? getClusterCountForLaunch(data, previousLaunchLabel) : null;
  const selectedFlakyRate = selectedTotal ? (selectedFlakyCount / selectedTotal) * 100 : 0;
  const selectedClusterCoverage = selectedFailed ? (selectedClusterCount / selectedFailed) * 100 : 0;
  const passRateDelta = formatDelta(selectedPassRate, previousPassRate, 'pts');
  const passedDelta = formatDelta(selectedPassed, previousPassed, 'tests');
  const failureDelta = formatDelta(selectedFailed, previousFailed, 'tests');
  const flakyDelta = formatDelta(selectedFlakyCount, previousFlakyCount, 'tests');
  const clusterDelta = formatDelta(selectedClusterCount, previousClusterCount, 'clusters');
  const chartModel = buildChartModel(contextLaunches);
  const timeframeLabel = formatDateRange(scope.contextLaunches || []);
  const buildLabel = getLaunchAttributeValue(selectedLaunch, ['build']) || 'No build attribute';
  const environmentLabel = getLaunchEnvironment(selectedLaunch);
  const tagLabel = getLaunchTags(selectedLaunch).join(', ') || 'No tags';
  const executionStatus = String(selectedLaunch.status || 'Unknown').toLowerCase();
  const selectedLaunchName = getLaunchName(selectedLaunch);
  const selectedLaunchNumberLabel = getLaunchNumberLabel(selectedLaunch);

  const summaryTiles = [
    {
      label: 'Latest pass rate',
      value: formatPercent(selectedPassRate),
      delta: passRateDelta,
      note: `${selectedLaunchName} ${selectedLaunchNumberLabel}`,
      action: 'Open pass-rate trends',
      accentClass: 'summary-accent-success',
      url: buildInsightsLink(projectId, TRENDS_SECTION),
    },
    {
      label: 'Passed tests',
      value: String(selectedPassed),
      delta: passedDelta,
      note: `${selectedPassed}/${selectedTotal || 0} tests passed in ${selectedLaunchName} ${selectedLaunchNumberLabel}`,
      action: 'Open this launch details',
      accentClass: 'summary-accent-success',
      launchLink: true,
    },
    {
      label: 'Failed tests',
      value: String(selectedFailed),
      delta: failureDelta,
      note: `${selectedFailed} failing tests in ${selectedLaunchName} ${selectedLaunchNumberLabel}`,
      action: 'Review failing tests',
      accentClass: 'summary-accent-danger',
      url: buildInsightsLink(projectId, FAILURE_SEARCH_SECTION),
    },
    {
      label: 'Flaky tests',
      value: String(selectedFlakyCount),
      delta: flakyDelta,
      note: `Pattern count tied to ${selectedLaunchName} ${selectedLaunchNumberLabel}`,
      action: 'Inspect flaky candidates',
      accentClass: 'summary-accent-warning',
      url: buildInsightsLink(projectId, FLAKINESS_SECTION),
    },
    {
      label: 'Failure clusters',
      value: String(selectedClusterCount),
      delta: clusterDelta,
      note: `Grouped signatures from ${selectedLaunchName} ${selectedLaunchNumberLabel}`,
      action: 'Open clustered failures',
      accentClass: 'summary-accent-info',
      url: buildInsightsLink(projectId, CLUSTER_VIEW_SECTION),
    },
  ];

  const healthRows = [
    {
      label: 'Pass rate',
      value: formatPercent(selectedPassRate),
      progress: selectedPassRate,
      tone: 'success',
      note: `${selectedPassed}/${selectedTotal || 0} tests passed`,
    },
    {
      label: 'Failure rate',
      value: formatPercent(selectedFailureRate),
      progress: selectedFailureRate,
      tone: 'danger',
      note: `${selectedFailed} failing tests in ${selectedLaunchLabel}`,
    },
    {
      label: 'Flaky resurfacing',
      value: formatPercent(selectedFlakyRate),
      progress: selectedFlakyRate,
      tone: 'warning',
      note: `${selectedFlakyCount} flaky tests linked to the current execution`,
    },
    {
      label: 'Cluster coverage',
      value: formatPercent(selectedClusterCoverage),
      progress: selectedClusterCoverage,
      tone: 'info',
      note: `${selectedClusterCount} failure clusters across ${selectedFailed} failed tests`,
    },
  ];

  return (
    <div className={cx('summary-page-shell')}>
      <div className={cx('summary-tiles')}>
        {summaryTiles.map((tile) => (
          <div key={tile.label} className={cx('summary-tile', tile.accentClass)}>
            <div className={cx('summary-tile-topline')}>
              <div className={cx('summary-tile-label')}>{tile.label}</div>
              <Badge tone={tile.delta.tone}>{tile.delta.text}</Badge>
            </div>
            {tile.launchLink ? (
              <ResourceLink projectId={projectId} launchName={selectedLaunchName} launchId={selectedLaunch.id} className={cx('summary-tile-value-link')}>
                <div className={cx('summary-tile-value')}>{tile.value}</div>
              </ResourceLink>
            ) : (
              <NavLink to={tile.url} className={cx('summary-tile-value-link')}>
                <div className={cx('summary-tile-value')}>{tile.value}</div>
              </NavLink>
            )}
            <div className={cx('summary-tile-note')}>{tile.note}</div>
            {tile.launchLink ? (
              <ResourceLink projectId={projectId} launchName={selectedLaunchName} launchId={selectedLaunch.id} className={cx('summary-action-link')}>
                {tile.action}
              </ResourceLink>
            ) : (
              <NavLink to={tile.url} className={cx('summary-action-link')}>
                {tile.action}
              </NavLink>
            )}
          </div>
        ))}
      </div>

      <div className={cx('summary-bottom')}>
        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div>
              <div className={cx('summary-panel-label')}>Execution pass rate</div>
              <div className={cx('summary-panel-big')}>{selectedLaunchName}</div>
              <div className={cx('summary-panel-subtitle')}>{selectedLaunchNumberLabel}</div>
            </div>
            <div className={cx('summary-panel-right')}>
              <div className={cx('summary-panel-context')}>{timeframeLabel}</div>
              <Badge tone={getStatusTone(selectedLaunch.status)}>{executionStatus}</Badge>
            </div>
          </div>
          <div className={cx('summary-chart-summary')}>
            <span className={cx('summary-chart-summary-value')}>{formatPercent(selectedPassRate)}</span>
            <span className={cx('summary-chart-summary-copy')}>
              {previousLaunch ? `${passRateDelta.text} vs ${previousLaunchLabel}` : 'No previous execution in current scope'}
            </span>
          </div>
          <div className={cx('summary-chart-shell')}>
            <div className={cx('summary-chart-yaxis')}>
              {CHART_Y_TICKS.map((tick) => (
                <span key={tick}>{tick}%</span>
              ))}
            </div>
            <div className={cx('summary-chart-area')}>
              <svg className={cx('summary-line-chart')} viewBox={`0 0 ${chartModel.width} ${CHART_HEIGHT + 8}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="summaryChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d9e75" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#1d9e75" stopOpacity="0.03" />
                  </linearGradient>
                </defs>
                {CHART_Y_TICKS.map((tick) => {
                  const y = CHART_HEIGHT - tick;
                  return (
                    <line
                      key={tick}
                      x1="0"
                      y1={y}
                      x2={chartModel.width}
                      y2={y}
                      className={cx('summary-chart-grid-line')}
                    />
                  );
                })}
                {chartModel.areaPath ? <path d={chartModel.areaPath} fill="url(#summaryChartFill)" /> : null}
                {chartModel.polylinePoints ? (
                  <polyline
                    points={chartModel.polylinePoints}
                    fill="none"
                    stroke="#2fd493"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {chartModel.points.map((point) => {
                  const isSelectedPoint = String(point.launch?.id) === String(selectedLaunch.id);
                  return (
                    <g key={String(point.launch?.id || point.label)}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isSelectedPoint ? 5 : 4}
                        className={cx('summary-chart-point', {
                          'summary-chart-point-selected': isSelectedPoint,
                        })}
                      >
                        <title>{`${point.label}: ${formatPercent(point.passRate)} (${getExecutionFailed(point.launch)} failed of ${getExecutionTotal(point.launch)})`}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
              <div className={cx('summary-chart-labels')}>
                {chartModel.points.map((point, index) => (
                  <ResourceLink key={`${point.launch?.id || point.shortLabel}-${index}`} projectId={projectId} launchName={point.launchName} launchId={point.launch?.id} className={cx('summary-chart-label-link')}>
                    <span className={cx('summary-chart-label-title')}>{point.launchName}</span>
                    <span className={cx('summary-chart-label-meta')}>{point.launchNumberLabel}</span>
                    <strong>{formatPercent(point.passRate)}</strong>
                  </ResourceLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div>
              <div className={cx('summary-panel-label')}>Execution health</div>
              <div className={cx('summary-panel-big')}>Independent quality indicators</div>
            </div>
            <div className={cx('summary-panel-right')}>
              <div className={cx('summary-panel-context')}>Metrics are not forced to sum to 100%</div>
            </div>
          </div>
          <div className={cx('summary-health-list')}>
            {healthRows.map((row) => (
              <div key={row.label} className={cx('summary-health-row')}>
                <div className={cx('summary-health-header')}>
                  <span className={cx('summary-health-label')}>{row.label}</span>
                  <strong className={cx('summary-health-value')}>{row.value}</strong>
                </div>
                <ProgressBar value={clamp(row.progress, 0, 100)} tone={row.tone} label={`${row.label}: ${row.value}`} />
                <div className={cx('summary-health-note')}>{row.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx('summary-dark-panel')}>
          <div className={cx('summary-panel-header')}>
            <div>
              <div className={cx('summary-panel-label')}>Current delivery window</div>
              <div className={cx('summary-panel-big')}>{timeframeLabel}</div>
            </div>
            <div className={cx('summary-panel-right')}>
              <div className={cx('summary-panel-context', 'summary-panel-context-nowrap')}>
                {`${scopedLaunches.length} ${scopedLaunches.length === 1 ? 'execution' : 'executions'} in scope`}
              </div>
            </div>
          </div>
          <div className={cx('summary-sprint-body')}>
            <div className={cx('summary-scope-card')}>
              <div className={cx('summary-scope-kicker')}>Selected execution</div>
              <ResourceLink projectId={projectId} launchName={selectedLaunchName} launchId={selectedLaunch.id} className={cx('summary-scope-link')}>
                {selectedLaunchName}
              </ResourceLink>
              <div className={cx('summary-scope-number')}>{selectedLaunchNumberLabel}</div>
              <div className={cx('summary-scope-copy')}>Build {buildLabel} in {environmentLabel}</div>
              <div className={cx('summary-scope-copy')}>{tagLabel}</div>
            </div>

            <div className={cx('summary-sprint-stats')}>
              <div className={cx('summary-sprint-stat')}>
                <span>Previous execution</span>
                <strong>{previousLaunchLabel}</strong>
              </div>
              <div className={cx('summary-sprint-stat')}>
                <span>Execution date</span>
                <strong>{formatDate(selectedLaunch.startTime)}</strong>
              </div>
              <div className={cx('summary-sprint-stat')}>
                <span>Total tests</span>
                <strong>{selectedTotal}</strong>
              </div>
              <div className={cx('summary-sprint-stat')}>
                <span>Passed tests</span>
                <strong>{selectedPassed}</strong>
              </div>
              <div className={cx('summary-sprint-stat')}>
                <span>Failed tests</span>
                <strong>{selectedFailed}</strong>
              </div>
            </div>

            <div className={cx('summary-sprint-section')}>
              <div className={cx('summary-sprint-progress-label')}>Execution pass rate trend</div>
              <div className={cx('summary-mini-trend')}>
                {contextLaunches.map((launch) => {
                  const passRate = getPassRate(launch);
                  const label = getLaunchLabel(launch);
                  const isSelectedLaunch = String(launch?.id) === String(selectedLaunch.id);

                  return (
                    <ResourceLink
                      key={String(launch?.id || label)}
                      projectId={projectId}
                      launchName={getLaunchName(launch)}
                      launchId={launch?.id}
                      className={cx('summary-mini-bar', {
                        'summary-mini-bar-selected': isSelectedLaunch,
                      })}
                      style={{ height: `${Math.max(passRate, 10)}%` }}
                    >
                      <span className={cx('summary-visually-hidden')}>{`${label}: ${formatPercent(passRate)}`}</span>
                    </ResourceLink>
                  );
                })}
              </div>
              <div className={cx('summary-chart-labels')}>
                {contextLaunches.map((launch) => {
                  const label = getLaunchLabel(launch);
                  return (
                    <ResourceLink key={String(launch?.id || label)} projectId={projectId} launchName={getLaunchName(launch)} launchId={launch?.id} className={cx('summary-chart-label-link')}>
                      <span className={cx('summary-chart-label-title')}>{getLaunchName(launch)}</span>
                      <span className={cx('summary-chart-label-meta')}>{getLaunchNumberLabel(launch)}</span>
                      <strong>{formatPercent(getPassRate(launch))}</strong>
                    </ResourceLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SummaryPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  scope: PropTypes.object.isRequired,
};

export default SummaryPage;
