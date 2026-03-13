/*
 * Copyright 2026 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { defineMessages, injectIntl } from 'react-intl';
import { docsReferences } from 'common/utils/referenceDictionary';
import styles from './analyzerCoverageKpi.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  autoClassified: {
    id: 'AnalyzerCoverageKpi.autoClassified',
    defaultMessage: 'Auto-classified',
  },
  avgConfidence: {
    id: 'AnalyzerCoverageKpi.avgConfidence',
    defaultMessage: 'Avg confidence',
  },
  manualTriage: {
    id: 'AnalyzerCoverageKpi.manualTriage',
    defaultMessage: 'Manual triage',
  },
  trend: {
    id: 'AnalyzerCoverageKpi.trend',
    defaultMessage: 'Trend',
  },
  unavailable: {
    id: 'AnalyzerCoverageKpi.unavailable',
    defaultMessage: 'n/a',
  },
  missingSprint: {
    id: 'AnalyzerCoverageKpi.missingSprint',
    defaultMessage: 'Add sprint attribute to launches to enable comparison',
  },
  documentation: {
    id: 'AnalyzerCoverageKpi.documentation',
    defaultMessage: 'Open launch attribute documentation',
  },
  improvingHint: {
    id: 'AnalyzerCoverageKpi.improvingHint',
    defaultMessage: 'Coverage is increasing versus the previous sprint.',
  },
  stableHint: {
    id: 'AnalyzerCoverageKpi.stableHint',
    defaultMessage: 'Coverage is effectively flat versus the previous sprint.',
  },
  degradingHint: {
    id: 'AnalyzerCoverageKpi.degradingHint',
    defaultMessage: 'Consider reviewing pattern rules',
  },
});

const trendMeta = {
  IMPROVING: { className: 'improving', arrow: '^', hint: 'improvingHint' },
  STABLE: { className: 'stable', arrow: '>', hint: 'stableHint' },
  DEGRADING: { className: 'degrading', arrow: 'v', hint: 'degradingHint' },
};

const formatPercent = (value) => `${Math.round(value)}%`;

export const AnalyzerCoverageKpi = injectIntl(({ widget, intl: { formatMessage } }) => {
  const { currentSprint, previousSprint, trend, missingSprintAttribute } = widget.content;

  if (missingSprintAttribute || !currentSprint || !previousSprint) {
    return (
      <div className={cx('empty-state')}>
        <div>{formatMessage(messages.missingSprint)}</div>
        <a
          className={cx('empty-link')}
          href={docsReferences.projectConfigurationDocs}
          target="_blank"
          rel="noreferrer"
          aria-label={formatMessage(messages.documentation)}
        >
          {formatMessage(messages.documentation)}
        </a>
      </div>
    );
  }

  const delta = Math.round((currentSprint.coveragePercent - previousSprint.coveragePercent) * 10) / 10;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const trendInfo = trendMeta[trend] || trendMeta.STABLE;
  const manualCount = Math.max(currentSprint.totalItems - currentSprint.autoClassified, 0);

  return (
    <div className={cx('analyzer-coverage-kpi')}>
      <div className={cx('hero')}>
        <div>
          <div className={cx('hero-value')}>{formatPercent(currentSprint.coveragePercent)}</div>
          <div className={cx('hero-label')}>{formatMessage(messages.autoClassified)}</div>
        </div>
        <div
          className={cx('delta', deltaClass)}
          title={formatMessage(messages[trendInfo.hint])}
          aria-label={`Coverage delta ${delta > 0 ? 'plus' : ''}${delta}%`}
        >
          {trendInfo.arrow} {delta > 0 ? '+' : ''}{delta}% vs last sprint
        </div>
      </div>

      <div className={cx('stats')}>
        <div className={cx('stat-row')}>
          <span>{formatMessage(messages.avgConfidence)}</span>
          <span>
            {currentSprint.avgConfidence == null
              ? formatMessage(messages.unavailable)
              : formatPercent(currentSprint.avgConfidence)}
          </span>
        </div>
        <div className={cx('stat-row')}>
          <span>{formatMessage(messages.manualTriage)}</span>
          <span>
            {formatPercent(currentSprint.manualTriagePercent)} ({manualCount} of {currentSprint.totalItems} items)
          </span>
        </div>
        <div className={cx('stat-row')}>
          <span>{formatMessage(messages.trend)}</span>
          <span
            className={cx('trend', trendInfo.className)}
            title={formatMessage(messages[trendInfo.hint])}
          >
            {trend} {trendInfo.arrow}
          </span>
        </div>
      </div>
    </div>
  );
});

AnalyzerCoverageKpi.propTypes = {
  widget: PropTypes.object.isRequired,
};