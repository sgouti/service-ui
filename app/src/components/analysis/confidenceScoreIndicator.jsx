import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames/bind';
import { getConfidenceTone } from './utils';
import styles from './confidenceScoreIndicator.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  confidence: {
    id: 'ConfidenceScoreIndicator.confidence',
    defaultMessage: 'Confidence',
  },
  matched: {
    id: 'ConfidenceScoreIndicator.matched',
    defaultMessage: 'Matched',
  },
  reviewRecommended: {
    id: 'ConfidenceScoreIndicator.reviewRecommended',
    defaultMessage: 'Review recommended',
  },
});

export const ConfidenceScoreIndicator = ({
  confidence = null,
  matchedLaunch = null,
  compact = false,
}) => {
  const { formatMessage } = useIntl();

  if (confidence == null) {
    return null;
  }

  const tone = getConfidenceTone(confidence);

  return (
    <div className={cx('indicator', `tone-${tone}`, { compact })}>
      <div className={cx('line')}>
        <span className={cx('label')}>{formatMessage(messages.confidence)}</span>
        <span className={cx('value')}>{Math.round(Number(confidence))}%</span>
        {tone === 'warning' && <span className={cx('warningDot')} aria-hidden="true" />}
      </div>
      {matchedLaunch && (
        <div className={cx('line')}>
          <span className={cx('label')}>{formatMessage(messages.matched)}</span>
          <span className={cx('value')}>{matchedLaunch}</span>
        </div>
      )}
      {tone === 'critical' && (
        <div className={cx('criticalNote')} title={formatMessage(messages.reviewRecommended)}>
          {formatMessage(messages.reviewRecommended)}
        </div>
      )}
    </div>
  );
};

ConfidenceScoreIndicator.propTypes = {
  confidence: PropTypes.number,
  matchedLaunch: PropTypes.string,
  compact: PropTypes.bool,
};
