import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { defineMessages, useIntl } from 'react-intl';
import { PageLayout, PageSection } from 'layouts/pageLayout';
import { Button } from '@reportportal/ui-kit';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { SpinningPreloader } from 'components/preloaders/spinningPreloader';
import { FlakinessDetailPanel } from 'components/flakiness';
import { COMMON_LOCALE_KEYS } from 'common/constants/localization';
import { ModalLayout } from 'components/main/modal';
import { showModalAction } from 'controllers/modal';
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
  flakinessDetails: {
    id: 'AnalyzerInsightsPage.flakinessDetails',
    defaultMessage: 'Flakiness Details',
  },
  historyRuns: { id: 'AnalyzerInsightsPage.historyRuns', defaultMessage: 'History Runs' },
  lastChange: { id: 'AnalyzerInsightsPage.lastChange', defaultMessage: 'Last Status Change' },
  notAvailable: { id: 'AnalyzerInsightsPage.notAvailable', defaultMessage: 'Not available' },
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

const FlakinessDetailsModal = ({ projectKey, itemId, itemName }) => {
  const { formatMessage } = useIntl();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(URLS.analyzerItemFlakiness(projectKey, itemId, { historyDepth: 10 })).then(setDetails);
  }, [projectKey, itemId]);

  return (
    <ModalLayout
      title={`${formatMessage(messages.flakinessDetails)}: ${itemName}`}
      cancelButton={{ text: formatMessage(COMMON_LOCALE_KEYS.CLOSE) }}
    >
      {!details ? (
        <SpinningPreloader />
      ) : (
        <FlakinessDetailPanel itemName={itemName} details={details} />
      )}
    </ModalLayout>
  );
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
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLaunchId, setSelectedLaunchId] = useState(null);
  const [selectedCompareId, setSelectedCompareId] = useState(null);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const requestedLaunchId = Number(query.launchId) || null;
  const requestedCompareId = Number(query.compareToId) || null;
  const requestedItemId = Number(query.itemId) || null;
  const requestedTab = query.tab || null;
  const requestedItemName = query.itemName || null;

  useEffect(() => {
    if (requestedTab === 'quarantine') {
      setActiveTab('quarantine');
    }
    if (requestedLaunchId) {
      setSelectedLaunchId(requestedLaunchId);
    }
    if (requestedCompareId) {
      setSelectedCompareId(requestedCompareId);
    }
  }, [requestedCompareId, requestedLaunchId, requestedTab]);

  useEffect(() => {
    if (!summary && !loading) {
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
    if (!requestedItemId || deepLinkHandled || !projectKey) {
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
    setDeepLinkHandled(true);
  }, [
    deepLinkHandled,
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

  const refreshInsights = (launchId, compareToId) => {
    dispatch(
      fetchAnalyzerInsightsAction({
        historyDepth: 10,
        launchId: launchId || undefined,
        compareToId: compareToId || undefined,
      }),
    );
  };

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

  if (!summary) {
    return (
      <PageLayout title={formatMessage(messages.title)}>
        <PageSection>
          <div className={cx('empty-state')}>{formatMessage(messages.noLaunches)}</div>
        </PageSection>
      </PageLayout>
    );
  }

  const currentLaunchId = selectedLaunchId || summary.launchId;
  const currentCompareId = selectedCompareId || summary.comparison?.baselineLaunchId || '';

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
                  setSelectedLaunchId(nextLaunchId);
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
                  setSelectedCompareId(value ? Number(value) : null);
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
              onClick={() => refreshInsights(currentLaunchId, currentCompareId)}
            >
              {formatMessage(messages.refresh)}
            </Button>
          </div>

          <div className={cx('tab-strip')}>
            <button
              type="button"
              aria-label={formatMessage(messages.overviewTab)}
              className={cx('tab-button', { 'tab-button-active': activeTab === 'overview' })}
              onClick={() => setActiveTab('overview')}
            >
              {formatMessage(messages.overviewTab)}
            </button>
            {features.quarantine && (
              <button
                type="button"
                aria-label={formatMessage(messages.quarantineTab)}
                className={cx('tab-button', { 'tab-button-active': activeTab === 'quarantine' })}
                onClick={() => setActiveTab('quarantine')}
              >
                {formatMessage(messages.quarantineTab)}
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
                    {summary.comparison ? (
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
                    <div className={cx('panel-header')}>
                      <div>
                        <div className={cx('panel-title')}>{formatMessage(messages.rootCause)}</div>
                        <div className={cx('panel-note')}>{formatMessage(messages.rootCauseNote)}</div>
                      </div>
                    </div>
                    {clustersLoading ? (
                      <SpinningPreloader />
                    ) : clusters.length ? (
                      <>
                        <div className={cx('table-head', 'table-head-cluster')}>
                          <div>ID</div>
                          <div>{formatMessage(messages.clusterItems)}</div>
                          <div>{formatMessage(messages.clusterMessage)}</div>
                        </div>
                        {clusters.map((cluster) => (
                          <div key={cluster.id} className={cx('cluster-row')}>
                            <div className={cx('strong')}>{cluster.id}</div>
                            <div>{cluster.matchedTests}</div>
                            <div className={cx('muted')}>{cluster.message}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className={cx('empty-state')}>{formatMessage(messages.emptyClusters)}</div>
                    )}
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
              {(summary.quarantine || []).length ? (
                <>
                  <div className={cx('table-head', 'table-head-quarantine')}>
                    <div>{formatMessage(messages.candidateColumn)}</div>
                    <div>{formatMessage(messages.statusHistoryColumn)}</div>
                    <div>{formatMessage(messages.flakyRateColumn)}</div>
                    <div>{formatMessage(messages.quarantineColumn)}</div>
                  </div>
                  {summary.quarantine.map((item) => (
                    <div key={item.itemId} className={cx('quarantine-row')}>
                      <div>
                        <div className={cx('strong')}>{item.name}</div>
                        <div className={cx('muted')}>{item.currentStatus}</div>
                      </div>
                      <div className={cx('muted')}>{(item.statusHistory || []).join(' -> ')}</div>
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