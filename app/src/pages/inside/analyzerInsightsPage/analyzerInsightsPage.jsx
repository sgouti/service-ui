import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { defineMessages, useIntl } from 'react-intl';
import { PageLayout, PageSection } from 'layouts/pageLayout';
import { Button } from '@reportportal/ui-kit';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { SpinningPreloader } from 'components/preloaders/spinningPreloader';
import { FlakinessDetailPanel } from 'components/flakiness';
import { RootCauseClusterView } from 'components/clusters';
import { COMMON_LOCALE_KEYS } from 'common/constants/localization';
import { ModalLayout } from 'components/main/modal';
import { showModalAction } from 'controllers/modal';
import { NOTIFICATION_TYPES, showNotification } from 'controllers/notification';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import { querySelector } from 'controllers/pages';
import {
  analyzerInsightsClustersLoadingSelector,
  analyzerInsightsClustersSelector,
  analyzerInsightsLoadingSelector,
  analyzerInsightsSelector,
  fetchAnalyzerClustersAction,
  fetchAnalyzerInsightsAction,
} from 'controllers/analyzerInsights';
import {
  COVERAGE_KPI_ENABLED,
  FLAKINESS_BADGE_ENABLED,
  INSIGHTS_PAGE_ENABLED,
  LAUNCH_COMPARISON_ENABLED,
  QUARANTINE_TAB_ENABLED,
  RELEASE_AGGREGATE_ENABLED,
  ROOT_CAUSE_CLUSTERS_ENABLED,
  TRIAGE_AGING_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import styles from './analyzerInsightsPage.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  title: { id: 'AnalyzerInsightsPage.title', defaultMessage: 'Analyzer Insights' },
  launchLabel: { id: 'AnalyzerInsightsPage.launchLabel', defaultMessage: 'Launch' },
  compareLabel: { id: 'AnalyzerInsightsPage.compareLabel', defaultMessage: 'Compare Against' },
  refresh: { id: 'AnalyzerInsightsPage.refresh', defaultMessage: 'Refresh' },
  overviewTab: { id: 'AnalyzerInsightsPage.overviewTab', defaultMessage: 'Overview' },
  quarantineTab: { id: 'AnalyzerInsightsPage.quarantineTab', defaultMessage: 'Quarantine' },
  disabled: {
    id: 'AnalyzerInsightsPage.disabled',
    defaultMessage: 'Analyzer Insights is disabled in project settings.',
  },
  noLaunches: {
    id: 'AnalyzerInsightsPage.noLaunches',
    defaultMessage: 'No launches are available for analyzer insights.',
  },
  coverage: { id: 'AnalyzerInsightsPage.coverage', defaultMessage: 'Analyzer Coverage' },
  autoAnalyzed: {
    id: 'AnalyzerInsightsPage.autoAnalyzed',
    defaultMessage: '{count} of {total} non-passed items were auto-analyzed',
  },
  flakyCandidates: {
    id: 'AnalyzerInsightsPage.flakyCandidates',
    defaultMessage: 'Flaky Candidates',
  },
  triageBuckets: { id: 'AnalyzerInsightsPage.triageBuckets', defaultMessage: 'Triage Buckets' },
  compareSummary: {
    id: 'AnalyzerInsightsPage.compareSummary',
    defaultMessage: 'Launch Comparison',
  },
  rootCause: {
    id: 'AnalyzerInsightsPage.rootCause',
    defaultMessage: 'Root-Cause Clusters',
  },
  rootCauseNote: {
    id: 'AnalyzerInsightsPage.rootCauseNote',
    defaultMessage: 'Top unique error clusters for the selected launch',
  },
  triageAging: {
    id: 'AnalyzerInsightsPage.triageAging',
    defaultMessage: 'Triage Aging Heatmap',
  },
  releaseAggregate: {
    id: 'AnalyzerInsightsPage.releaseAggregate',
    defaultMessage: 'Release Aggregate',
  },
  comparisonDiff: {
    id: 'AnalyzerInsightsPage.comparisonDiff',
    defaultMessage: 'Launch Comparison Diff',
  },
  quarantineCandidates: {
    id: 'AnalyzerInsightsPage.quarantineCandidates',
    defaultMessage: 'Quarantine Candidates',
  },
  quarantineNote: {
    id: 'AnalyzerInsightsPage.quarantineNote',
    defaultMessage: 'Items with repeated status switching across recent launches',
  },
  clusterMessage: { id: 'AnalyzerInsightsPage.clusterMessage', defaultMessage: 'Message' },
  clusterItems: { id: 'AnalyzerInsightsPage.clusterItems', defaultMessage: 'Matched Tests' },
  emptyClusters: {
    id: 'AnalyzerInsightsPage.emptyClusters',
    defaultMessage: 'No root-cause clusters were returned for this launch.',
  },
  emptyComparison: {
    id: 'AnalyzerInsightsPage.emptyComparison',
    defaultMessage: 'No comparison baseline is available yet.',
  },
  emptyQuarantine: {
    id: 'AnalyzerInsightsPage.emptyQuarantine',
    defaultMessage: 'No quarantine candidates were detected for this launch.',
  },
  emptyReleaseAggregate: {
    id: 'AnalyzerInsightsPage.emptyReleaseAggregate',
    defaultMessage: 'Release history is not available yet for this launch name.',
  },
  flaky: { id: 'AnalyzerInsightsPage.flaky', defaultMessage: 'Flaky' },
  stable: { id: 'AnalyzerInsightsPage.stable', defaultMessage: 'Stable' },
  launchColumn: { id: 'AnalyzerInsightsPage.launchColumn', defaultMessage: 'Launch' },
  statusColumn: { id: 'AnalyzerInsightsPage.statusColumn', defaultMessage: 'Status' },
  timeColumn: { id: 'AnalyzerInsightsPage.timeColumn', defaultMessage: 'Time' },
  currentColumn: { id: 'AnalyzerInsightsPage.currentColumn', defaultMessage: 'Current' },
  baselineColumn: { id: 'AnalyzerInsightsPage.baselineColumn', defaultMessage: 'Baseline' },
  deltaColumn: { id: 'AnalyzerInsightsPage.deltaColumn', defaultMessage: 'Delta' },
  candidateColumn: { id: 'AnalyzerInsightsPage.candidateColumn', defaultMessage: 'Candidate' },
  statusHistoryColumn: {
    id: 'AnalyzerInsightsPage.statusHistoryColumn',
    defaultMessage: 'Status History',
  },
  flakyRateColumn: { id: 'AnalyzerInsightsPage.flakyRateColumn', defaultMessage: 'Flaky Rate' },
  quarantineColumn: {
    id: 'AnalyzerInsightsPage.quarantineColumn',
    defaultMessage: 'Quarantine',
  },
  runsColumn: { id: 'AnalyzerInsightsPage.runsColumn', defaultMessage: 'Runs' },
  transitionsColumn: {
    id: 'AnalyzerInsightsPage.transitionsColumn',
    defaultMessage: 'Switches',
  },
  flakinessDetails: {
    id: 'AnalyzerInsightsPage.flakinessDetails',
    defaultMessage: 'Flakiness Details',
  },
  flakinessUnavailable: {
    id: 'AnalyzerInsightsPage.flakinessUnavailable',
    defaultMessage: 'Flakiness details are unavailable because the analyzer endpoint is not supported by the current backend.',
  },
  historyRuns: { id: 'AnalyzerInsightsPage.historyRuns', defaultMessage: 'History Runs' },
  lastChange: { id: 'AnalyzerInsightsPage.lastChange', defaultMessage: 'Last Status Change' },
  notAvailable: { id: 'AnalyzerInsightsPage.notAvailable', defaultMessage: 'Not available' },
  passRate: { id: 'AnalyzerInsightsPage.passRate', defaultMessage: 'Pass Rate' },
  adjustedPassRate: {
    id: 'AnalyzerInsightsPage.adjustedPassRate',
    defaultMessage: 'Adjusted Pass Rate',
  },
  adjustedPassRateHint: {
    id: 'AnalyzerInsightsPage.adjustedPassRateHint',
    defaultMessage: 'Excludes {count} quarantined tests from the denominator',
  },
  alreadyQuarantined: {
    id: 'AnalyzerInsightsPage.alreadyQuarantined',
    defaultMessage: 'Already Quarantined',
  },
  selectedLaunch: {
    id: 'AnalyzerInsightsPage.selectedLaunch',
    defaultMessage: 'Selected Launch',
  },
  analyzing: {
    id: 'AnalyzerInsightsPage.analyzing',
    defaultMessage: 'Analyzing launch insights',
  },
});

const FEATURE_DEFAULTS = {
  [INSIGHTS_PAGE_ENABLED]: true,
  [FLAKINESS_BADGE_ENABLED]: true,
  [TRIAGE_AGING_ENABLED]: true,
  [ROOT_CAUSE_CLUSTERS_ENABLED]: true,
  [COVERAGE_KPI_ENABLED]: true,
  [RELEASE_AGGREGATE_ENABLED]: true,
  [LAUNCH_COMPARISON_ENABLED]: true,
  [QUARANTINE_TAB_ENABLED]: true,
};

const METRIC_LABELS = {
  'statistics$executions$passed': 'Passed',
  'statistics$executions$failed': 'Failed',
  'statistics$executions$skipped': 'Skipped',
  'statistics$defects$automation_bug$total': 'Auto Bug',
  'statistics$defects$product_bug$total': 'Product Bug',
  'statistics$defects$system_issue$total': 'System Issue',
  'statistics$defects$to_investigate$total': 'To Investigate',
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : null);

const isFeatureEnabled = (config, key) => {
  const rawValue = config?.[key];
  if (rawValue === undefined) {
    return FEATURE_DEFAULTS[key] ?? true;
  }
  return rawValue === true || rawValue === 'true';
};

const getBadgeClass = (rate) => (rate >= 50 ? 'badge' : 'badge badge-low');

const roundPercent = (value) => Math.round(value * 10) / 10;

const getMetricMap = (summary, launchId) => {
  const releaseLaunch = (summary.releaseAggregate || []).find((launch) => launch.id === launchId);
  if (releaseLaunch?.values) {
    return releaseLaunch.values;
  }

  if (summary.comparison?.currentLaunchId === launchId) {
    return (summary.comparison.metrics || []).reduce((acc, metric) => {
      acc[metric.field] = metric.current;
      return acc;
    }, {});
  }

  return {};
};

const getLaunchLabel = (summary, launchId) => {
  const launch = (summary.recentLaunches || []).find((item) => item.id === launchId);
  if (launch) {
    return `${launch.name} #${launch.number}`;
  }

  if (summary.launchId === launchId && summary.launchName && summary.launchNumber) {
    return `${summary.launchName} #${summary.launchNumber}`;
  }

  return null;
};

const getQuarantineStats = (summary, launchId) => {
  const metricMap = getMetricMap(summary, launchId);
  const passed = metricMap['statistics$executions$passed'] || 0;
  const failed = metricMap['statistics$executions$failed'] || 0;
  const skipped = metricMap['statistics$executions$skipped'] || 0;
  const totalItems = summary.coverage?.totalItems || passed + failed + skipped;
  const quarantineCount = (summary.quarantine || []).length;
  const quarantinedCount = (summary.quarantine || []).filter((item) => item.quarantined).length;
  const adjustedTotal = Math.max(totalItems - quarantinedCount, 0);

  return {
    quarantineCount,
    quarantinedCount,
    basePassRate: totalItems > 0 ? roundPercent((passed / totalItems) * 100) : null,
    adjustedPassRate: adjustedTotal > 0 ? roundPercent((passed / adjustedTotal) * 100) : null,
    launchLabel: getLaunchLabel(summary, launchId),
  };
};

const getCurrentLaunchMetrics = (summary, launchId) => getMetricMap(summary, launchId);

const coveragePropType = PropTypes.shape({
  coveragePercent: PropTypes.number,
  autoAnalyzedItems: PropTypes.number,
  nonPassedItems: PropTypes.number,
});

const comparisonMetricPropType = PropTypes.shape({
  field: PropTypes.string,
  label: PropTypes.string,
  baseline: PropTypes.number,
  current: PropTypes.number,
  delta: PropTypes.number,
});

const summaryPropType = PropTypes.shape({
  coverage: coveragePropType,
  quarantine: PropTypes.arrayOf(PropTypes.object),
  triageAging: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      count: PropTypes.number,
    }),
  ),
  comparison: PropTypes.shape({
    metrics: PropTypes.arrayOf(comparisonMetricPropType),
  }),
});

const FlakinessDetailsModal = ({ projectKey, itemId, itemName }) => {
  const { formatMessage } = useIntl();
  const [details, setDetails] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(URLS.analyzerItemFlakiness(projectKey, itemId, { historyDepth: 10 }))
      .then((response) => {
        if (!cancelled) {
          setDetails(response);
          setHasError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails(null);
          setHasError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectKey, itemId]);

  return (
    <ModalLayout
      title={`${formatMessage(messages.flakinessDetails)}: ${itemName}`}
      cancelButton={{ text: formatMessage(COMMON_LOCALE_KEYS.CLOSE) }}
    >
      {!details && !hasError ? (
        <SpinningPreloader />
      ) : hasError ? (
        <div className={cx('empty-state')}>{formatMessage(messages.flakinessUnavailable)}</div>
      ) : (
        <FlakinessDetailPanel itemName={itemName} details={details} />
      )}
    </ModalLayout>
  );
};

FlakinessDetailsModal.propTypes = {
  projectKey: PropTypes.string.isRequired,
  itemId: PropTypes.number.isRequired,
  itemName: PropTypes.string.isRequired,
};

const OverviewCards = ({ summary, formatMessage }) => (
  <div className={cx('cards')}>
    <div className={cx('card')}>
      <div className={cx('card-label')}>{formatMessage(messages.coverage)}</div>
      <div className={cx('card-value')}>{summary.coverage?.coveragePercent || 0}%</div>
      <div className={cx('card-caption')}>
        {formatMessage(messages.autoAnalyzed, {
          count: summary.coverage?.autoAnalyzedItems || 0,
          total: summary.coverage?.nonPassedItems || 0,
        })}
      </div>
    </div>
    <div className={cx('card')}>
      <div className={cx('card-label')}>{formatMessage(messages.flakyCandidates)}</div>
      <div className={cx('card-value')}>{summary.quarantine?.length || 0}</div>
      <div className={cx('card-caption')}>{formatMessage(messages.quarantineCandidates)}</div>
    </div>
    <div className={cx('card')}>
      <div className={cx('card-label')}>{formatMessage(messages.triageBuckets)}</div>
      <div className={cx('card-value')}>
        {(summary.triageAging || []).reduce((acc, bucket) => acc + bucket.count, 0)}
      </div>
      <div className={cx('card-caption')}>{formatMessage(messages.triageAging)}</div>
    </div>
    <div className={cx('card')}>
      <div className={cx('card-label')}>{formatMessage(messages.compareSummary)}</div>
      <div className={cx('card-value')}>{summary.comparison?.metrics?.length || 0}</div>
      <div className={cx('card-caption')}>{formatMessage(messages.comparisonDiff)}</div>
    </div>
  </div>
);

OverviewCards.propTypes = {
  summary: summaryPropType.isRequired,
  formatMessage: PropTypes.func.isRequired,
};

export const AnalyzerInsightsPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const projectKey = useSelector(projectKeySelector);
  const analyzerConfig = useSelector(analyzerAttributesSelector);
  const query = useSelector(querySelector);
  const summary = useSelector(analyzerInsightsSelector);
  const loading = useSelector(analyzerInsightsLoadingSelector);
  const clusters = useSelector(analyzerInsightsClustersSelector);
  const clustersLoading = useSelector(analyzerInsightsClustersLoadingSelector);
  const [activeTabOverride, setActiveTabOverride] = useState(null);
  const [selectedLaunchIdOverride, setSelectedLaunchIdOverride] = useState(null);
  const [selectedCompareIdOverride, setSelectedCompareIdOverride] = useState(null);
  const handledDeepLinkRef = useRef(null);

  const requestedLaunchId = Number(query.launchId) || null;
  const requestedCompareId = Number(query.compareToId) || null;
  const requestedItemId = Number(query.itemId) || null;
  const requestedTab = query.tab || null;
  const requestedItemName = query.itemName || null;

  useEffect(() => {
    const needsInitialLoad = !summary && !loading;
    const needsRequestedLaunch = !!summary && !!requestedLaunchId && summary.launchId !== requestedLaunchId;
    const needsRequestedCompare =
      !!summary &&
      !!requestedCompareId &&
      summary.comparison?.baselineLaunchId !== requestedCompareId;

    if (needsInitialLoad || needsRequestedLaunch || needsRequestedCompare) {
      dispatch(
        fetchAnalyzerInsightsAction({
          historyDepth: 10,
          launchId: requestedLaunchId || undefined,
          compareToId: requestedCompareId || undefined,
        }),
      );
    }
  }, [summary, loading, dispatch, requestedCompareId, requestedLaunchId]);

  useEffect(() => {
    if (summary?.launchId) {
      dispatch(fetchAnalyzerClustersAction({ launchId: summary.launchId }));
    }
  }, [summary?.launchId, dispatch]);

  useEffect(() => {
    if (!loading && !clustersLoading) {
      return () => {};
    }

    const timer = setTimeout(() => {
      dispatch(
        showNotification({
          message: formatMessage(messages.analyzing),
          type: NOTIFICATION_TYPES.INFO,
          duration: 2500,
        }),
      );
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [clustersLoading, dispatch, formatMessage, loading]);

  useEffect(() => {
    if (!requestedItemId || !projectKey) {
      handledDeepLinkRef.current = null;
      return;
    }

    if (handledDeepLinkRef.current === requestedItemId) {
      return;
    }

    dispatch(
      showModalAction({
        component: (
          <FlakinessDetailsModal
            projectKey={projectKey}
            itemId={requestedItemId}
            itemName={
              requestedItemName ||
              summary?.quarantine?.find((item) => item.itemId === requestedItemId)?.name ||
              `Item #${requestedItemId}`
            }
          />
        ),
      }),
    );
    handledDeepLinkRef.current = requestedItemId;
  }, [
    dispatch,
    projectKey,
    requestedItemId,
    requestedItemName,
    summary?.quarantine,
  ]);

  const features = useMemo(
    () => ({
      page: isFeatureEnabled(analyzerConfig, INSIGHTS_PAGE_ENABLED),
      flakiness: isFeatureEnabled(analyzerConfig, FLAKINESS_BADGE_ENABLED),
      triage: isFeatureEnabled(analyzerConfig, TRIAGE_AGING_ENABLED),
      clusters: isFeatureEnabled(analyzerConfig, ROOT_CAUSE_CLUSTERS_ENABLED),
      coverage: isFeatureEnabled(analyzerConfig, COVERAGE_KPI_ENABLED),
      releaseAggregate: isFeatureEnabled(analyzerConfig, RELEASE_AGGREGATE_ENABLED),
      comparison: isFeatureEnabled(analyzerConfig, LAUNCH_COMPARISON_ENABLED),
      quarantine: isFeatureEnabled(analyzerConfig, QUARANTINE_TAB_ENABLED),
    }),
    [analyzerConfig],
  );

  const activeTab =
    activeTabOverride || (requestedTab === 'quarantine' && features.quarantine ? 'quarantine' : 'overview');

  const refreshInsights = (launchId, compareToId) => {
    dispatch(
      fetchAnalyzerInsightsAction({
        historyDepth: 10,
        launchId: launchId || undefined,
        compareToId: compareToId || undefined,
      }),
    );
  };

  if (!features.page) {
    return (
      <PageLayout title={formatMessage(messages.title)}>
        <PageSection>
          <div className={cx('empty-state')}>{formatMessage(messages.disabled)}</div>
        </PageSection>
      </PageLayout>
    );
  }

  if (loading && !summary) {
    return <SpinningPreloader />;
  }

  if (!summary || (!summary.launchId && !(summary.recentLaunches || []).length)) {
    return (
      <PageLayout title={formatMessage(messages.title)}>
        <PageSection>
          <div className={cx('empty-state')}>{formatMessage(messages.noLaunches)}</div>
        </PageSection>
      </PageLayout>
    );
  }

  const currentLaunchId = selectedLaunchIdOverride || requestedLaunchId || summary.launchId;
  const currentCompareId =
    selectedCompareIdOverride || requestedCompareId || summary.comparison?.baselineLaunchId || '';

  const openFlakinessModal = (item) => {
    dispatch(
      showModalAction({
        component: (
          <FlakinessDetailsModal
            projectKey={projectKey}
            itemId={item.itemId}
            itemName={item.name}
          />
        ),
      }),
    );
  };
  const quarantineStats = getQuarantineStats(summary, currentLaunchId);
  const currentLaunchMetrics = getCurrentLaunchMetrics(summary, currentLaunchId);
  const currentLaunchFailures = currentLaunchMetrics['statistics$executions$failed'] || 0;

  return (
    <PageLayout title={formatMessage(messages.title)}>
      <PageSection>
        <div className={cx('page')}>
          <div className={cx('toolbar')}>
            <div className={cx('field')}>
              <label className={cx('field-label')}>{formatMessage(messages.launchLabel)}</label>
              <select
                className={cx('select')}
                aria-label={formatMessage(messages.launchLabel)}
                value={currentLaunchId || ''}
                onChange={(event) => {
                  const nextLaunchId = Number(event.target.value);
                  setSelectedLaunchIdOverride(nextLaunchId);
                  refreshInsights(nextLaunchId, currentCompareId ? Number(currentCompareId) : null);
                }}
              >
                {(summary.recentLaunches || []).map((launch) => (
                  <option key={launch.id} value={launch.id}>
                    {launch.name} #{launch.number}
                  </option>
                ))}
              </select>
            </div>
            <div className={cx('field')}>
              <label className={cx('field-label')}>{formatMessage(messages.compareLabel)}</label>
              <select
                className={cx('select')}
                aria-label={formatMessage(messages.compareLabel)}
                value={currentCompareId}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedCompareIdOverride(value ? Number(value) : null);
                  refreshInsights(currentLaunchId, value ? Number(value) : null);
                }}
              >
                <option value="">-</option>
                {(summary.recentLaunches || [])
                  .filter((launch) => launch.id !== currentLaunchId)
                  .map((launch) => (
                    <option key={launch.id} value={launch.id}>
                      {launch.name} #{launch.number}
                    </option>
                  ))}
              </select>
            </div>
            <Button
              aria-label={formatMessage(messages.refresh)}
              onClick={() =>
                refreshInsights(currentLaunchId, currentCompareId ? Number(currentCompareId) : null)
              }
            >
              {formatMessage(messages.refresh)}
            </Button>
          </div>

          <div className={cx('tab-strip')}>
            <button
              type="button"
              aria-label={formatMessage(messages.overviewTab)}
              className={cx('tab-button', { 'tab-button-active': activeTab === 'overview' })}
              onClick={() => setActiveTabOverride('overview')}
            >
              {formatMessage(messages.overviewTab)}
            </button>
            {features.quarantine && (
              <button
                type="button"
                aria-label={formatMessage(messages.quarantineTab)}
                className={cx('tab-button', { 'tab-button-active': activeTab === 'quarantine' })}
                onClick={() => setActiveTabOverride('quarantine')}
              >
                {formatMessage(messages.quarantineTab)}
                <span className={cx('tab-count')}>{quarantineStats.quarantineCount}</span>
              </button>
            )}
          </div>

          {activeTab === 'overview' && (
            <>
              <OverviewCards summary={summary} formatMessage={formatMessage} />
              <div className={cx('grid')}>
                {features.triage && (
                  <div className={cx('panel')}>
                    <div className={cx('panel-header')}>
                      <div className={cx('panel-title')}>{formatMessage(messages.triageAging)}</div>
                    </div>
                    {(summary.triageAging || []).map((bucket) => {
                      const maxCount = (summary.triageAging || []).reduce(
                        (acc, item) => Math.max(acc, item.count),
                        0,
                      );
                      const width = maxCount ? `${(bucket.count / maxCount) * 100}%` : '0%';
                      return (
                        <div key={bucket.label} className={cx('heatmap-row')}>
                          <div className={cx('strong')}>{bucket.label}</div>
                          <div className={cx('bar-track')}>
                            <div className={cx('bar-fill')} style={{ width }} />
                          </div>
                          <div className={cx('muted')}>{bucket.count}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {features.comparison && (
                  <div className={cx('panel')}>
                    <div className={cx('panel-header')}>
                      <div className={cx('panel-title')}>{formatMessage(messages.comparisonDiff)}</div>
                    </div>
                    {summary.comparison?.metrics?.length ? (
                      <>
                        <div className={cx('table-head', 'table-head-metric')}>
                          <div>{formatMessage(messages.compareSummary)}</div>
                          <div>{formatMessage(messages.baselineColumn)}</div>
                          <div>{formatMessage(messages.currentColumn)}</div>
                          <div>{formatMessage(messages.deltaColumn)}</div>
                        </div>
                        {summary.comparison.metrics.map((metric) => (
                          <div key={metric.field} className={cx('metric-row')}>
                            <div className={cx('strong')}>
                              {METRIC_LABELS[metric.field] || metric.label}
                            </div>
                            <div>{metric.baseline}</div>
                            <div>{metric.current}</div>
                            <div
                              className={cx({
                                'metric-positive': metric.delta > 0,
                                'metric-negative': metric.delta < 0,
                              })}
                            >
                              {metric.delta > 0 ? `+${metric.delta}` : metric.delta}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className={cx('empty-state')}>{formatMessage(messages.emptyComparison)}</div>
                    )}
                  </div>
                )}

                {features.clusters && (
                  <div className={cx('panel')}>
                    <RootCauseClusterView
                      clusters={clusters}
                      loading={clustersLoading}
                      projectKey={projectKey}
                      launchId={summary.launchId}
                      totalFailures={currentLaunchFailures}
                    />
                  </div>
                )}

                {features.releaseAggregate && (
                  <div className={cx('panel')}>
                    <div className={cx('panel-header')}>
                      <div className={cx('panel-title')}>{formatMessage(messages.releaseAggregate)}</div>
                    </div>
                    {(summary.releaseAggregate || []).length ? (
                      <table className={cx('release-table')}>
                        <thead>
                          <tr>
                            <th>{formatMessage(messages.launchColumn)}</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Skipped</th>
                            <th>TI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.releaseAggregate.map((launch) => (
                            <tr key={launch.id}>
                              <td>
                                <span className={cx('strong')}>
                                  {launch.name} #{launch.number}
                                </span>
                                <div className={cx('muted')}>{formatDateTime(launch.startTime)}</div>
                              </td>
                              <td>{launch.values['statistics$executions$passed'] || 0}</td>
                              <td>{launch.values['statistics$executions$failed'] || 0}</td>
                              <td>{launch.values['statistics$executions$skipped'] || 0}</td>
                              <td>{launch.values['statistics$defects$to_investigate$total'] || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={cx('empty-state')}>
                        {formatMessage(messages.emptyReleaseAggregate)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'quarantine' && features.quarantine && (
            <div className={cx('panel')}>
              <div className={cx('panel-header')}>
                <div>
                  <div className={cx('panel-title')}>{formatMessage(messages.quarantineCandidates)}</div>
                  <div className={cx('panel-note')}>{formatMessage(messages.quarantineNote)}</div>
                </div>
              </div>
              <div className={cx('cards', 'quarantine-summary')}>
                <div className={cx('card')}>
                  <div className={cx('card-label')}>{formatMessage(messages.quarantineCandidates)}</div>
                  <div className={cx('card-value')}>{quarantineStats.quarantineCount}</div>
                  <div className={cx('card-caption')}>{formatMessage(messages.historyRuns)}</div>
                </div>
                <div className={cx('card')}>
                  <div className={cx('card-label')}>{formatMessage(messages.alreadyQuarantined)}</div>
                  <div className={cx('card-value')}>{quarantineStats.quarantinedCount}</div>
                  <div className={cx('card-caption')}>{formatMessage(messages.quarantineColumn)}</div>
                </div>
                <div className={cx('card')}>
                  <div className={cx('card-label')}>{formatMessage(messages.adjustedPassRate)}</div>
                  <div className={cx('card-value')}>
                    {quarantineStats.adjustedPassRate === null
                      ? formatMessage(messages.notAvailable)
                      : `${quarantineStats.adjustedPassRate}%`}
                  </div>
                  <div className={cx('card-caption')}>
                    {quarantineStats.basePassRate === null
                      ? formatMessage(messages.notAvailable)
                      : `${formatMessage(messages.passRate)} ${quarantineStats.basePassRate}%`}
                  </div>
                  <div className={cx('card-caption')}>
                    {formatMessage(messages.adjustedPassRateHint, {
                      count: quarantineStats.quarantineCount,
                    })}
                  </div>
                </div>
                <div className={cx('card')}>
                  <div className={cx('card-label')}>{formatMessage(messages.selectedLaunch)}</div>
                  <div className={cx('card-value', 'card-value-small')}>
                    {quarantineStats.launchLabel || formatMessage(messages.notAvailable)}
                  </div>
                  <div className={cx('card-caption')}>{formatMessage(messages.launchColumn)}</div>
                </div>
              </div>
              {(summary.quarantine || []).length ? (
                <>
                  <div className={cx('table-head', 'table-head-quarantine')}>
                    <div>{formatMessage(messages.candidateColumn)}</div>
                    <div>{formatMessage(messages.statusHistoryColumn)}</div>
                    <div>{formatMessage(messages.runsColumn)}</div>
                    <div>{formatMessage(messages.transitionsColumn)}</div>
                    <div>{formatMessage(messages.flakyRateColumn)}</div>
                    <div>{formatMessage(messages.quarantineColumn)}</div>
                  </div>
                  {summary.quarantine.map((item) => (
                    <div key={item.itemId} className={cx('quarantine-row')}>
                      <div>
                        <div className={cx('strong')}>{item.name}</div>
                        <div className={cx('muted')}>{item.currentStatus}</div>
                      </div>
                      <div className={cx('muted', 'status-history')}>
                        {(item.statusHistory || []).join(' -> ')}
                      </div>
                      <div>{item.totalRuns || 0}</div>
                      <div>{item.flakyTransitions || 0}</div>
                      <div>
                        {features.flakiness ? (
                          <button
                            type="button"
                            aria-label={`${formatMessage(messages.flakinessDetails)} ${item.name}`}
                            className={cx(getBadgeClass(item.flakyRate))}
                            onClick={() => openFlakinessModal(item)}
                          >
                            {formatMessage(messages.flaky)} {item.flakyRate}%
                          </button>
                        ) : (
                          <span>{item.flakyRate}%</span>
                        )}
                      </div>
                      <div className={cx({ strong: item.quarantined, muted: !item.quarantined })}>
                        {item.quarantined
                          ? formatMessage(messages.quarantineTab)
                          : formatMessage(messages.stable)}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={cx('empty-state')}>{formatMessage(messages.emptyQuarantine)}</div>
              )}
            </div>
          )}
        </div>
      </PageSection>
    </PageLayout>
  );
};