import React, { useEffect, useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { SpinningPreloader } from 'components/preloaders/spinningPreloader';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import {
  INSIGHTS_PAGE_ENABLED,
  RELEASE_AGGREGATE_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import styles from './productVersionsPage.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  title: {
    id: 'ProductVersionsPage.releaseInsights.title',
    defaultMessage: 'Release insights',
  },
  subtitle: {
    id: 'ProductVersionsPage.releaseInsights.subtitle',
    defaultMessage: 'Analyzer release aggregates for the selected launch family.',
  },
  launch: {
    id: 'ProductVersionsPage.releaseInsights.launch',
    defaultMessage: 'Launch',
  },
  coverage: {
    id: 'ProductVersionsPage.releaseInsights.coverage',
    defaultMessage: 'Coverage',
  },
  quarantine: {
    id: 'ProductVersionsPage.releaseInsights.quarantine',
    defaultMessage: 'Quarantine Candidates',
  },
  unavailable: {
    id: 'ProductVersionsPage.releaseInsights.unavailable',
    defaultMessage: 'Release insights are disabled in analyzer settings.',
  },
  empty: {
    id: 'ProductVersionsPage.releaseInsights.empty',
    defaultMessage: 'No release aggregate is available yet.',
  },
});

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');

export const ReleaseInsightsTab = () => {
  const { formatMessage } = useIntl();
  const projectKey = useSelector(projectKeySelector);
  const analyzerAttributes = useSelector(analyzerAttributesSelector);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const insightsEnabled = analyzerAttributes?.[INSIGHTS_PAGE_ENABLED] !== 'false';
  const releaseAggregateEnabled = analyzerAttributes?.[RELEASE_AGGREGATE_ENABLED] !== 'false';

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      if (!projectKey || !insightsEnabled || !releaseAggregateEnabled) {
        setLoading(false);
        return;
      }

      const response = await fetch(URLS.analyzerInsights(projectKey, { historyDepth: 10 }));
      if (!cancelled) {
        setSummary(response);
        setLoading(false);
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [insightsEnabled, projectKey, releaseAggregateEnabled]);

  if (!insightsEnabled || !releaseAggregateEnabled) {
    return <div className={cx('product-versions-page__empty')}>{formatMessage(messages.unavailable)}</div>;
  }

  if (loading) {
    return <SpinningPreloader />;
  }

  return (
    <div className={cx('product-versions-page__insights')}>
      <div className={cx('product-versions-page__insights-header')}>
        <div>
          <div className={cx('product-versions-page__insights-title')}>
            {formatMessage(messages.title)}
          </div>
          <div className={cx('product-versions-page__insights-subtitle')}>
            {formatMessage(messages.subtitle)}
          </div>
        </div>
      </div>

      <div className={cx('product-versions-page__summary-cards')}>
        <div className={cx('product-versions-page__summary-card')}>
          <div className={cx('product-versions-page__summary-label')}>
            {formatMessage(messages.coverage)}
          </div>
          <div className={cx('product-versions-page__summary-value')}>
            {summary?.coverage?.coveragePercent || 0}%
          </div>
        </div>
        <div className={cx('product-versions-page__summary-card')}>
          <div className={cx('product-versions-page__summary-label')}>
            {formatMessage(messages.quarantine)}
          </div>
          <div className={cx('product-versions-page__summary-value')}>
            {summary?.quarantine?.length || 0}
          </div>
        </div>
      </div>

      {(summary?.releaseAggregate || []).length ? (
        <table className={cx('product-versions-page__release-table')}>
          <thead>
            <tr>
              <th>{formatMessage(messages.launch)}</th>
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
                  <div className={cx('product-versions-page__launch-name')}>
                    {launch.name} #{launch.number}
                  </div>
                  <div className={cx('product-versions-page__launch-time')}>
                    {formatDateTime(launch.startTime)}
                  </div>
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
        <div className={cx('product-versions-page__empty')}>{formatMessage(messages.empty)}</div>
      )}
    </div>
  );
};