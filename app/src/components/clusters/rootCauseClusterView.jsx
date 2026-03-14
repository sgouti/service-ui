import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames/bind';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { PROJECT_LOG_PAGE } from 'controllers/pages';
import { linkIssue, editDefect } from 'controllers/step';
import { showDefaultErrorNotification } from 'controllers/notification';
import { NameLink } from 'pages/inside/common/nameLink';
import styles from './rootCauseClusterView.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  title: { id: 'RootCauseClusterView.title', defaultMessage: 'Root-Cause Clusters' },
  note: {
    id: 'RootCauseClusterView.note',
    defaultMessage: 'Top unique error clusters for the selected launch',
  },
  linkIssue: { id: 'RootCauseClusterView.linkIssue', defaultMessage: 'Link Issue' },
  expandTests: { id: 'RootCauseClusterView.expandTests', defaultMessage: 'Expand tests' },
  collapseTests: { id: 'RootCauseClusterView.collapseTests', defaultMessage: 'Collapse tests' },
  triageAll: { id: 'RootCauseClusterView.triageAll', defaultMessage: 'Triage all' },
  loadMore: { id: 'RootCauseClusterView.loadMore', defaultMessage: 'Load more' },
  ofFails: { id: 'RootCauseClusterView.ofFails', defaultMessage: '{value}% of fails' },
  loading: { id: 'RootCauseClusterView.loading', defaultMessage: 'Loading...' },
  emptyShort: {
    id: 'RootCauseClusterView.emptyShort',
    defaultMessage: 'Clustering requires 10+ failures.',
  },
  emptyLong: {
    id: 'RootCauseClusterView.emptyLong',
    defaultMessage: 'This launch has fewer failures than needed.',
  },
  emptyGeneric: {
    id: 'RootCauseClusterView.emptyGeneric',
    defaultMessage: 'No root-cause clusters were returned for this launch.',
  },
});

const INITIAL_CLUSTER_ITEMS = {
  collapsed: true,
  loading: false,
  actionLoading: false,
  content: [],
  page: {},
};

const getClusterState = (state, id) => state[id] || INITIAL_CLUSTER_ITEMS;
const getClusterTitle = (cluster) => cluster.message?.split('\n').find(Boolean) || `Cluster #${cluster.id}`;
const getClusterShare = (matchedTests, totalFailures) => {
  if (!totalFailures) {
    return 0;
  }
  return Math.round((matchedTests / totalFailures) * 100);
};

export const RootCauseClusterView = ({
  clusters = [],
  loading = false,
  projectKey = '',
  launchId = null,
  totalFailures = 0,
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [clusterItemsMap, setClusterItemsMap] = useState({});

  const sortedClusters = useMemo(
    () => [...clusters].sort((left, right) => (right.matchedTests || 0) - (left.matchedTests || 0)),
    [clusters],
  );

  const fetchClusterItems = async (clusterId, pageNumber = 1, append = false, pageSize = 5) => {
    setClusterItemsMap((previous) => ({
      ...previous,
      [clusterId]: {
        ...getClusterState(previous, clusterId),
        loading: true,
        collapsed: false,
      },
    }));

    try {
      const response = await fetch(URLS.testItemsWithProviderType(projectKey), {
        params: {
          'page.page': pageNumber,
          'page.size': pageSize,
          'page.sort': 'startTime,DESC',
          providerType: 'cluster',
          launchId,
          'filter.any.clusterId': clusterId,
        },
      });

      setClusterItemsMap((previous) => {
        const current = getClusterState(previous, clusterId);
        return {
          ...previous,
          [clusterId]: {
            ...current,
            loading: false,
            collapsed: false,
            content: append ? [...current.content, ...(response.content || [])] : response.content || [],
            page: response.page || {},
          },
        };
      });

      return response.content || [];
    } catch (error) {
      setClusterItemsMap((previous) => ({
        ...previous,
        [clusterId]: {
          ...getClusterState(previous, clusterId),
          loading: false,
        },
      }));
      dispatch(showDefaultErrorNotification(error));
      return [];
    }
  };

  const fetchAllClusterItems = async (clusterId) => {
    const cachedState = getClusterState(clusterItemsMap, clusterId);
    if (cachedState.content.length && cachedState.page?.totalPages === cachedState.page?.number) {
      return cachedState.content;
    }

    let pageNumber = 1;
    let totalPages = 1;
    let items = [];

    try {
      do {
        const response = await fetch(URLS.testItemsWithProviderType(projectKey), {
          params: {
            'page.page': pageNumber,
            'page.size': 50,
            'page.sort': 'startTime,DESC',
            providerType: 'cluster',
            launchId,
            'filter.any.clusterId': clusterId,
          },
        });
        items = [...items, ...(response.content || [])];
        totalPages = response.page?.totalPages || 1;
        pageNumber += 1;
      } while (pageNumber <= totalPages);
    } catch (error) {
      dispatch(showDefaultErrorNotification(error));
      return [];
    }

    setClusterItemsMap((previous) => ({
      ...previous,
      [clusterId]: {
        ...getClusterState(previous, clusterId),
        collapsed: false,
        loading: false,
        content: items,
        page: {
          number: totalPages,
          totalPages,
        },
      },
    }));

    return items;
  };

  const setActionLoading = (clusterId, actionLoading) => {
    setClusterItemsMap((previous) => ({
      ...previous,
      [clusterId]: {
        ...getClusterState(previous, clusterId),
        actionLoading,
      },
    }));
  };

  const toggleCluster = async (clusterId) => {
    const current = getClusterState(clusterItemsMap, clusterId);
    if (!current.collapsed) {
      setClusterItemsMap((previous) => ({
        ...previous,
        [clusterId]: {
          ...getClusterState(previous, clusterId),
          collapsed: true,
        },
      }));
      return;
    }

    if (!current.content.length) {
      await fetchClusterItems(clusterId);
      return;
    }

    setClusterItemsMap((previous) => ({
      ...previous,
      [clusterId]: {
        ...getClusterState(previous, clusterId),
        collapsed: false,
      },
    }));
  };

  const handleClusterAction = async (clusterId, actionCreator) => {
    setActionLoading(clusterId, true);
    try {
      const items = await fetchAllClusterItems(clusterId);
      if (!items.length) {
        return;
      }
      dispatch(
        actionCreator(items, {
          fetchFunc: () => fetchClusterItems(clusterId),
          eventsInfo: {},
        }),
      );
    } finally {
      setActionLoading(clusterId, false);
    }
  };

  if (loading) {
    return (
      <div className={cx('cluster-view')}>
        <div className={cx('cluster-header')}>
          <div>
            <div className={cx('cluster-title')}>{formatMessage(messages.title)}</div>
            <div className={cx('cluster-note')}>{formatMessage(messages.note)}</div>
          </div>
        </div>
        <div className={cx('cluster-list')}>
          {[1, 2, 3].map((key) => (
            <div key={key} className={cx('cluster-card', 'cluster-card-skeleton')}>
              <div className={cx('skeleton-line', 'skeleton-line-title')} />
              <div className={cx('skeleton-line')} />
              <div className={cx('skeleton-bar')} />
              <div className={cx('skeleton-actions')}>
                <div className={cx('skeleton-pill')} />
                <div className={cx('skeleton-pill')} />
                <div className={cx('skeleton-pill')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedClusters.length) {
    return (
      <div className={cx('cluster-view')}>
        <div className={cx('cluster-header')}>
          <div>
            <div className={cx('cluster-title')}>{formatMessage(messages.title)}</div>
            <div className={cx('cluster-note')}>{formatMessage(messages.note)}</div>
          </div>
        </div>
        <div className={cx('empty-state')}>
          {totalFailures < 5
            ? `${formatMessage(messages.emptyShort)} ${formatMessage(messages.emptyLong)}`
            : formatMessage(messages.emptyGeneric)}
        </div>
      </div>
    );
  }

  return (
    <div className={cx('cluster-view')}>
      <div className={cx('cluster-header')}>
        <div>
          <div className={cx('cluster-title')}>{formatMessage(messages.title)}</div>
          <div className={cx('cluster-note')}>{formatMessage(messages.note)}</div>
        </div>
      </div>
      <div className={cx('cluster-list')}>
        {sortedClusters.map((cluster) => {
          const clusterState = getClusterState(clusterItemsMap, cluster.id);
          const share = getClusterShare(cluster.matchedTests || 0, totalFailures);
          const hasMore = (clusterState.page?.totalPages || 1) > (clusterState.page?.number || 1);

          return (
            <div key={cluster.id} className={cx('cluster-card')}>
              <div className={cx('cluster-card-head')}>
                <div>
                  <div className={cx('cluster-card-title')}>{getClusterTitle(cluster)}</div>
                  <div className={cx('cluster-card-message')}>{cluster.message}</div>
                </div>
                <div className={cx('cluster-count')}>{cluster.matchedTests} tests</div>
              </div>
              <div className={cx('share-row')}>
                <div className={cx('share-track')}>
                  <div className={cx('share-fill')} style={{ width: `${share}%` }} />
                </div>
                <div className={cx('share-label')}>
                  {formatMessage(messages.ofFails, { value: share })}
                </div>
              </div>
              <div className={cx('cluster-actions')}>
                <button
                  type="button"
                  className={cx('action-button')}
                  disabled={clusterState.actionLoading}
                  onClick={() => handleClusterAction(cluster.id, linkIssue)}
                >
                  {clusterState.actionLoading
                    ? formatMessage(messages.loading)
                    : formatMessage(messages.linkIssue)}
                </button>
                <button
                  type="button"
                  className={cx('action-button')}
                  onClick={() => toggleCluster(cluster.id)}
                >
                  {clusterState.collapsed
                    ? formatMessage(messages.expandTests)
                    : formatMessage(messages.collapseTests)}
                </button>
                <button
                  type="button"
                  className={cx('action-button', 'action-button-primary')}
                  disabled={clusterState.actionLoading}
                  onClick={() => handleClusterAction(cluster.id, editDefect)}
                >
                  {clusterState.actionLoading
                    ? formatMessage(messages.loading)
                    : formatMessage(messages.triageAll)}
                </button>
              </div>

              {!clusterState.collapsed && (
                <div className={cx('cluster-items')}>
                  {clusterState.loading ? (
                    <div className={cx('items-loading')}>{formatMessage(messages.loading)}</div>
                  ) : (
                    <>
                      {(clusterState.content || []).map((item) => (
                        <div key={item.id || item.itemId} className={cx('cluster-item-row')}>
                          <NameLink
                            itemId={item.id || item.itemId}
                            className={cx('cluster-item-link')}
                            ownLinkParams={{ testItem: item, page: PROJECT_LOG_PAGE }}
                          >
                            {item.name}
                          </NameLink>
                          <div className={cx('cluster-item-status')}>{item.status}</div>
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          type="button"
                          className={cx('load-more-button')}
                          onClick={() =>
                            fetchClusterItems(cluster.id, (clusterState.page?.number || 1) + 1, true)
                          }
                        >
                          {formatMessage(messages.loadMore)}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

RootCauseClusterView.propTypes = {
  clusters: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  projectKey: PropTypes.string,
  launchId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  totalFailures: PropTypes.number,
};