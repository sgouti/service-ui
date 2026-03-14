import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { defineMessages, useIntl } from 'react-intl';
import styles from './flakinessBadge.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  title: {
    id: 'FlakinessDetailPanel.title',
    defaultMessage: 'Flakiness details',
  },
  status: {
    id: 'FlakinessDetailPanel.status',
    defaultMessage: 'Status',
  },
  score: {
    id: 'FlakinessDetailPanel.score',
    defaultMessage: 'Flaky rate',
  },
  totalRuns: {
    id: 'FlakinessDetailPanel.totalRuns',
    defaultMessage: 'History runs',
  },
  transitions: {
    id: 'FlakinessDetailPanel.transitions',
    defaultMessage: 'Transitions',
  },
  passRate: {
    id: 'FlakinessDetailPanel.passRate',
    defaultMessage: 'Pass rate',
  },
  quarantine: {
    id: 'FlakinessDetailPanel.quarantine',
    defaultMessage: 'Quarantine',
  },
  lastChange: {
    id: 'FlakinessDetailPanel.lastChange',
    defaultMessage: 'Last change',
  },
  history: {
    id: 'FlakinessDetailPanel.history',
    defaultMessage: 'Recent history',
  },
  noHistory: {
    id: 'FlakinessDetailPanel.noHistory',
    defaultMessage: 'No flakiness history is available for this item.',
  },
  stable: {
    id: 'FlakinessDetailPanel.stable',
    defaultMessage: 'Stable',
  },
  quarantined: {
    id: 'FlakinessDetailPanel.quarantined',
    defaultMessage: 'Quarantined',
  },
  openInsights: {
    id: 'FlakinessDetailPanel.openInsights',
    defaultMessage: 'Open analyzer insights',
  },
});

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');

const getScore = (details) => details?.flakinessScore ?? details?.flakyRate ?? null;
const getLabel = (details) => details?.label ?? null;
const getTotalRuns = (details) => details?.analyzedRuns ?? details?.totalRuns ?? 0;
const getTransitions = (details) => details?.alternationRate ?? details?.flakyTransitions ?? 0;
const getPassRate = (details) => details?.passRate;
const getLastChange = (details) => details?.lastStatusChange ?? details?.lastAnalyzed;

export const FlakinessDetailPanel = ({ itemName = '', details = {}, onOpenInsights = null }) => {
    const { formatMessage } = useIntl();
    const history = details?.history || [];
    const passRate = getPassRate(details);
  const score = getScore(details);
  const label = getLabel(details);

    return (
      <div className={cx('detail-panel')} role="dialog" aria-label={formatMessage(messages.title)}>
        <div className={cx('detail-header')}>
          <div>
            <div className={cx('detail-title')}>{formatMessage(messages.title)}</div>
            {itemName && <div className={cx('detail-subtitle')}>{itemName}</div>}
          </div>
          {onOpenInsights && (
            <button
              type="button"
              className={cx('detail-link')}
              onClick={onOpenInsights}
            >
              {formatMessage(messages.openInsights)}
            </button>
          )}
        </div>

        <div className={cx('detail-cards')}>
          {label && (
            <div className={cx('detail-card')}>
              <div className={cx('detail-label')}>{formatMessage(messages.status)}</div>
              <div className={cx('detail-value')}>{label}</div>
            </div>
          )}
          {score !== null && score !== undefined && (
          <div className={cx('detail-card')}>
            <div className={cx('detail-label')}>{formatMessage(messages.score)}</div>
            <div className={cx('detail-value')}>{score}%</div>
          </div>
          )}
          <div className={cx('detail-card')}>
            <div className={cx('detail-label')}>{formatMessage(messages.totalRuns)}</div>
            <div className={cx('detail-value')}>{getTotalRuns(details)}</div>
          </div>
          <div className={cx('detail-card')}>
            <div className={cx('detail-label')}>{formatMessage(messages.transitions)}</div>
            <div className={cx('detail-value')}>{getTransitions(details)}</div>
          </div>
          <div className={cx('detail-card')}>
            <div className={cx('detail-label')}>{formatMessage(messages.quarantine)}</div>
            <div className={cx('detail-value')}>
              {details?.quarantined
                ? formatMessage(messages.quarantined)
                : formatMessage(messages.stable)}
            </div>
          </div>
        </div>

        {(typeof passRate === 'number' || getLastChange(details)) && (
          <div className={cx('detail-metadata')}>
            {typeof passRate === 'number' && (
              <div className={cx('detail-meta-row')}>
                <span className={cx('detail-meta-label')}>{formatMessage(messages.passRate)}</span>
                <span className={cx('detail-meta-value')}>{passRate}%</span>
              </div>
            )}
            {getLastChange(details) && (
              <div className={cx('detail-meta-row')}>
                <span className={cx('detail-meta-label')}>{formatMessage(messages.lastChange)}</span>
                <span className={cx('detail-meta-value')}>{formatDateTime(getLastChange(details))}</span>
              </div>
            )}
          </div>
        )}

        <div className={cx('detail-history')}>
          <div className={cx('detail-history-title')}>{formatMessage(messages.history)}</div>
          {history.length ? (
            history.map((entry) => (
              <div key={`${entry.launchId || 'launch'}-${entry.itemId || entry.timestamp}`} className={cx('detail-history-row')}>
                <div className={cx('detail-history-primary')}>
                  {entry.launchName || `#${entry.launchId || '-'}`}
                </div>
                <div className={cx('detail-history-status')}>{entry.status}</div>
                <div className={cx('detail-history-secondary')}>
                  {formatDateTime(entry.timestamp || entry.startTime)}
                </div>
              </div>
            ))
          ) : (
            <div className={cx('detail-empty')}>{formatMessage(messages.noHistory)}</div>
          )}
        </div>
      </div>
    );
  };

FlakinessDetailPanel.propTypes = {
  itemName: PropTypes.string,
  details: PropTypes.object,
  onOpenInsights: PropTypes.func,
};