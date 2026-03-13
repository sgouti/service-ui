import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { defineMessages, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { useOnClickOutside } from 'common/hooks/useOnClickOutside';
import { projectKeySelector } from 'controllers/project';
import { FlakinessDetailPanel } from './flakinessDetailPanel';
import styles from './flakinessBadge.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  openDetails: {
    id: 'FlakinessBadge.openDetails',
    defaultMessage: 'Open flakiness details',
  },
});

const getScore = (details) => details?.flakinessScore ?? details?.flakyRate ?? null;

const getLabelFromScore = (score) => {
  if (score === null || score === undefined) {
    return null;
  }
  if (score <= 20) {
    return 'STABLE';
  }
  if (score <= 50) {
    return 'UNSTABLE';
  }
  if (score <= 75) {
    return 'FLAKY';
  }
  return 'CRITICAL';
};

const getToneClass = (score) => {
  if (score <= 20) {
    return 'stable';
  }
  if (score <= 50) {
    return 'unstable';
  }
  if (score <= 75) {
    return 'flaky';
  }
  return 'critical';
};

export const FlakinessBadge = ({ itemId = null, itemName = '', enabled = false, onOpenInsights = null }) => {
  const { formatMessage } = useIntl();
  const projectKey = useSelector(projectKeySelector);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useOnClickOutside(rootRef, open ? () => setOpen(false) : null);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      if (!enabled || !projectKey || !itemId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(URLS.analyzerItemFlakiness(projectKey, itemId, { historyDepth: 10 }));
        if (!cancelled) {
          setDetails(response);
        }
      } catch (error) {
        if (!cancelled) {
          setDetails(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [enabled, itemId, projectKey]);

  const score = getScore(details);
  const label = useMemo(() => details?.label || getLabelFromScore(score), [details, score]);

  if (!enabled) {
    return null;
  }

  if (loading) {
    return <span className={cx('badge-skeleton')} aria-hidden="true" />;
  }

  if (score === null || score === undefined || !label) {
    return null;
  }

  return (
    <span className={cx('badge-wrapper')} ref={rootRef}>
      <button
        type="button"
        className={cx('badge', getToneClass(score))}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${formatMessage(messages.openDetails)} ${label} ${score}`}
      >
        <span className={cx('badge-label')}>{label}</span>
        <span className={cx('badge-score')}>{score}</span>
      </button>
      {open && (
        <FlakinessDetailPanel
          itemName={itemName}
          details={details}
          onOpenInsights={onOpenInsights}
        />
      )}
    </span>
  );
};

FlakinessBadge.propTypes = {
  itemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  itemName: PropTypes.string,
  enabled: PropTypes.bool,
  onOpenInsights: PropTypes.func,
};

export { getLabelFromScore };