import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { SpinningPreloader } from 'components/preloaders/spinningPreloader';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import { launchIdSelector } from 'controllers/pages';
import { PROVIDER_TYPE_CLUSTER } from 'controllers/testItem';
import {
  FLAKINESS_BADGE_ENABLED,
  QUARANTINE_TAB_ENABLED,
  ROOT_CAUSE_CLUSTERS_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import styles from './analyzerInsightsTab.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  overview: {
    id: 'LogItemAnalyzerInsights.overview',
    defaultMessage: 'Analyzer Overview',
  },
  flakyRate: {
    id: 'LogItemAnalyzerInsights.flakyRate',
    defaultMessage: 'Flaky Rate',
  },
  totalRuns: {
    id: 'LogItemAnalyzerInsights.totalRuns',
    defaultMessage: 'History Runs',
  },
  transitions: {
    id: 'LogItemAnalyzerInsights.transitions',
    defaultMessage: 'Transitions',
  },
  quarantine: {
    id: 'LogItemAnalyzerInsights.quarantine',
    defaultMessage: 'Quarantine',
  },
  history: {
    id: 'LogItemAnalyzerInsights.history',
    defaultMessage: 'Flakiness History',
  },
  cluster: {
    id: 'LogItemAnalyzerInsights.cluster',
    defaultMessage: 'Root-Cause Cluster',
  },
  noHistory: {
    id: 'LogItemAnalyzerInsights.noHistory',
    defaultMessage: 'No flakiness history is available for this item.',
  },
  noCluster: {
    id: 'LogItemAnalyzerInsights.noCluster',
    defaultMessage: 'No matching root-cause cluster was resolved for this item in the selected launch.',
  },
  stable: {
    id: 'LogItemAnalyzerInsights.stable',
    defaultMessage: 'Stable',
  },
  lastChange: {
    id: 'LogItemAnalyzerInsights.lastChange',
    defaultMessage: 'Last change',
  },
  launch: {
    id: 'LogItemAnalyzerInsights.launch',
    defaultMessage: 'Launch',
  },
  status: {
    id: 'LogItemAnalyzerInsights.status',
    defaultMessage: 'Status',
  },
  startTime: {
    id: 'LogItemAnalyzerInsights.startTime',
    defaultMessage: 'Started',
  },
  matchedTests: {
    id: 'LogItemAnalyzerInsights.matchedTests',
    defaultMessage: 'Matched Tests',
  },
  unavailable: {
    id: 'LogItemAnalyzerInsights.unavailable',
    defaultMessage: 'Analyzer insights are disabled for this project.',
  },
  serviceUnavailable: {
    id: 'LogItemAnalyzerInsights.serviceUnavailable',
    defaultMessage: 'Analyzer service data is unavailable for this item.',
  },
});

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');

export const AnalyzerInsightsTab = ({ logItem = {} }) => {
  const { formatMessage } = useIntl();
  const projectKey = useSelector(projectKeySelector);
  const launchId = useSelector(launchIdSelector);
  const analyzerAttributes = useSelector(analyzerAttributesSelector);
  const [flakiness, setFlakiness] = useState(null);
  const [clusterMatch, setClusterMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const features = useMemo(
    () => ({
      flakiness: analyzerAttributes?.[FLAKINESS_BADGE_ENABLED] !== 'false',
      quarantine: analyzerAttributes?.[QUARANTINE_TAB_ENABLED] !== 'false',
      clusters: analyzerAttributes?.[ROOT_CAUSE_CLUSTERS_ENABLED] !== 'false',
    }),
    [analyzerAttributes],
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!projectKey || !logItem?.id) {
        return;
      }

      setLoading(true);
      setServiceUnavailable(false);
      try {
        const tasks = [];
        if (features.flakiness || features.quarantine) {
          tasks.push(
            fetch(URLS.analyzerItemFlakiness(projectKey, logItem.id, { historyDepth: 10 })),
          );
        } else {
          tasks.push(Promise.resolve(null));
        }

        if (features.clusters && launchId) {
          tasks.push(
            fetch(URLS.clusterByLaunchId(projectKey, launchId, { 'page.page': 1, 'page.size': 25 })),
          );
        } else {
          tasks.push(Promise.resolve({ content: [] }));
        }

        const [flakinessResponse, clustersResponse] = await Promise.all(tasks);
        if (cancelled) {
          return;
        }

        setFlakiness(flakinessResponse);

        if (features.clusters && launchId && clustersResponse?.content?.length) {
          const topClusters = clustersResponse.content.slice(0, 8);
          for (const cluster of topClusters) {
            const clusterItems = await fetch(URLS.testItemsWithProviderType(projectKey), {
              params: {
                providerType: PROVIDER_TYPE_CLUSTER,
                launchId,
                'filter.any.clusterId': cluster.id,
                'page.page': 1,
                'page.size': 25,
              },
            });

            if (cancelled) {
              return;
            }

            if ((clusterItems?.content || []).some((item) => item.id === logItem.id)) {
              setClusterMatch({
                id: cluster.id,
                matchedTests: cluster.matchedTests,
                message: cluster.message,
              });
              break;
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setFlakiness(null);
          setClusterMatch(null);
          setServiceUnavailable(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [features.clusters, features.flakiness, features.quarantine, launchId, logItem?.id, projectKey]);

  if (!features.flakiness && !features.quarantine && !features.clusters) {
    return <div className={cx('empty-state')}>{formatMessage(messages.unavailable)}</div>;
  }

  if (loading) {
    return <SpinningPreloader />;
  }

  if (serviceUnavailable) {
    return <div className={cx('empty-state')}>{formatMessage(messages.serviceUnavailable)}</div>;
  }

  return (
    <div className={cx('container')}>
      <div className={cx('cards')}>
        <div className={cx('card')}>
          <div className={cx('label')}>{formatMessage(messages.flakyRate)}</div>
          <div className={cx('value')}>{flakiness?.flakyRate || 0}%</div>
        </div>
        <div className={cx('card')}>
          <div className={cx('label')}>{formatMessage(messages.totalRuns)}</div>
          <div className={cx('value')}>{flakiness?.totalRuns || 0}</div>
        </div>
        <div className={cx('card')}>
          <div className={cx('label')}>{formatMessage(messages.transitions)}</div>
          <div className={cx('value')}>{flakiness?.flakyTransitions || 0}</div>
        </div>
        <div className={cx('card')}>
          <div className={cx('label')}>{formatMessage(messages.quarantine)}</div>
          <div className={cx('value')}>
            {flakiness?.quarantined ? formatMessage(messages.quarantine) : formatMessage(messages.stable)}
          </div>
          <div className={cx('caption')}>
            {formatMessage(messages.lastChange)}: {formatDateTime(flakiness?.lastStatusChange)}
          </div>
        </div>
      </div>

      <div className={cx('panel')}>
        <div className={cx('panel-title')}>{formatMessage(messages.history)}</div>
        {(flakiness?.history || []).length ? (
          flakiness.history.map((entry) => (
            <div key={`${entry.launchId}-${entry.itemId}`} className={cx('history-row')}>
              <div className={cx('strong')}>
                {entry.launchName} #{entry.launchNumber}
              </div>
              <div>{entry.status}</div>
              <div className={cx('muted')}>{formatDateTime(entry.startTime)}</div>
            </div>
          ))
        ) : (
          <div className={cx('empty-state')}>{formatMessage(messages.noHistory)}</div>
        )}
      </div>

      <div className={cx('panel')}>
        <div className={cx('panel-title')}>{formatMessage(messages.cluster)}</div>
        {clusterMatch ? (
          <div className={cx('cluster-row')}>
            <div>
              <div className={cx('label')}>#{clusterMatch.id}</div>
              <div className={cx('value')}>{clusterMatch.matchedTests}</div>
              <div className={cx('caption')}>{formatMessage(messages.matchedTests)}</div>
            </div>
            <div>
              <div className={cx('strong')}>{formatMessage(messages.overview)}</div>
              <div className={cx('muted')}>{clusterMatch.message}</div>
            </div>
          </div>
        ) : (
          <div className={cx('empty-state')}>{formatMessage(messages.noCluster)}</div>
        )}
      </div>
    </div>
  );
};

AnalyzerInsightsTab.propTypes = {
  logItem: PropTypes.object,
};