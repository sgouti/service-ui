/*
 * Copyright 2021 EPAM Systems
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
import { useIntl } from 'react-intl';
import { useTracking } from 'react-tracking';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { TO_INVESTIGATE_LOCATOR_PREFIX } from 'common/constants/defectTypes';
import { analyzerAttributesSelector } from 'controllers/project';
import {
  CONFIDENCE_SCORE_ENABLED,
  HYBRID_SEARCH_INDICATOR_ENABLED,
  RANKED_SUGGESTIONS_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import { TestItemDetails } from '../../elements/testItemDetails';
import { messages } from '../../messages';
import styles from './machineLearningSuggestions.scss';

const cx = classNames.bind(styles);

const isFeatureEnabled = (config, key) => config[key] !== 'false';

const normalizeRank = (value) => Math.max(1, Number(value) || 1);

const getConfidenceLabel = (score, formatMessage) => {
  if (score >= 85) {
    return formatMessage(messages.confidenceHigh);
  }
  if (score >= 60) {
    return formatMessage(messages.confidenceMedium);
  }
  return formatMessage(messages.confidenceLow);
};

const getRetrievalLabel = (suggestRs, formatMessage) => {
  const method = `${suggestRs.methodName || ''} ${suggestRs.modelInfo || ''}`.toLowerCase();

  if (method.includes('hybrid')) {
    return formatMessage(messages.hybridSearch);
  }
  if (method.includes('rerank') || method.includes('bge')) {
    return formatMessage(messages.reranked);
  }
  if (method.includes('semantic') || method.includes('embed')) {
    return formatMessage(messages.semanticSearch);
  }
  return formatMessage(messages.keywordSearch);
};

export const MachineLearningSuggestions = ({ modalState, itemData = {}, eventsInfo = {} }) => {
  const { formatMessage } = useIntl();
  const { trackEvent } = useTracking();
  const analyzerAttributes = useSelector(analyzerAttributesSelector);

  const item = modalState.suggestChoice;
  const { logs, suggestRs } = item;
  const showConfidence = isFeatureEnabled(analyzerAttributes, CONFIDENCE_SCORE_ENABLED);
  const showRank = isFeatureEnabled(analyzerAttributes, RANKED_SUGGESTIONS_ENABLED);
  const showHybrid = isFeatureEnabled(analyzerAttributes, HYBRID_SEARCH_INDICATOR_ENABLED);

  const defectFromTIGroup = itemData.issue?.issueType.startsWith(TO_INVESTIGATE_LOCATOR_PREFIX);

  const onClickExternalLinkEvent = () => {
    trackEvent(eventsInfo.getClickItemLinkEvent(defectFromTIGroup, 'ml_suggestions'));
  };
  const onOpenStackTraceEvent = () => {
    return eventsInfo.getOpenStackTraceEvent(defectFromTIGroup, 'ml_suggestions');
  };

  return (
    <>
      {(showConfidence || showRank || showHybrid) && (
        <div className={cx('summary-note')}>
          {formatMessage(messages.machineLearningSuggestions, { value: suggestRs.matchScore })}
        </div>
      )}
      {(showConfidence || showRank || showHybrid) && (
        <div className={cx('summary')}>
          {showConfidence && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.confidence)}</div>
              <div className={cx('summary-value')}>
                {getConfidenceLabel(suggestRs.matchScore, formatMessage)}
              </div>
            </div>
          )}
          {showRank && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.rank)}</div>
              <div className={cx('summary-value')}>#{normalizeRank(suggestRs.resultPosition)}</div>
            </div>
          )}
          {showRank && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.keywordRank)}</div>
              <div className={cx('summary-value')}>#{normalizeRank(suggestRs.esPosition)}</div>
            </div>
          )}
          {showHybrid && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.retrieval)}</div>
              <div className={cx('summary-value')}>
                {getRetrievalLabel(suggestRs, formatMessage)}
              </div>
            </div>
          )}
          {showHybrid && !!suggestRs.esScore && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.semanticScore)}</div>
              <div className={cx('summary-value')}>{Number(suggestRs.esScore).toFixed(3)}</div>
            </div>
          )}
          {showHybrid && !!suggestRs.modelInfo && (
            <div className={cx('summary-card')}>
              <div className={cx('summary-label')}>{formatMessage(messages.model)}</div>
              <div className={cx('summary-value')}>{suggestRs.modelInfo}</div>
            </div>
          )}
        </div>
      )}
      <TestItemDetails
        item={item}
        logs={logs}
        highlightedLogId={suggestRs.relevantLogId}
        highlightedMessage={formatMessage(messages.similarLog)}
        showErrorLogs
        eventsInfo={{
          onOpenStackTraceEvent,
          onClickExternalLinkEvent,
        }}
      />
    </>
  );
};

MachineLearningSuggestions.propTypes = {
  modalState: PropTypes.object.isRequired,
  itemData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  eventsInfo: PropTypes.object,
};
