import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames/bind';
import { normalizeMatchSource } from './utils';
import styles from './hybridSearchIndicator.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  semantic: {
    id: 'HybridSearchIndicator.semantic',
    defaultMessage: 'Matched by meaning - similar error even with different wording',
  },
  keyword: {
    id: 'HybridSearchIndicator.keyword',
    defaultMessage: 'Matched by shared keywords in error text',
  },
  hybrid: {
    id: 'HybridSearchIndicator.hybrid',
    defaultMessage: 'Strong match - both meaning and keywords align',
  },
});

const tooltipBySource = {
  semantic: messages.semantic,
  keyword: messages.keyword,
  hybrid: messages.hybrid,
};

export const HybridSearchIndicator = ({
  matchSource = '',
  methodName = '',
  modelInfo = '',
}) => {
  const { formatMessage } = useIntl();
  const source = normalizeMatchSource(matchSource, methodName, modelInfo);

  return (
    <span
      className={cx('tag', source)}
      title={formatMessage(tooltipBySource[source])}
      aria-label={`${source} match source`}
    >
      {source}
    </span>
  );
};

HybridSearchIndicator.propTypes = {
  matchSource: PropTypes.string,
  methodName: PropTypes.string,
  modelInfo: PropTypes.string,
};
