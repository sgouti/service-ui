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
import {
  ConfidenceScoreIndicator,
  HybridSearchIndicator,
  RankedSuggestionsPanel,
} from 'components/analysis';
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

export const MachineLearningSuggestions = ({
  modalState,
  itemData = {},
  eventsInfo = {},
  suggestedItems = [],
  onApplySuggestion = () => {},
}) => {
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
      {showRank && suggestedItems.length > 0 ? (
        <RankedSuggestionsPanel
          suggestions={suggestedItems}
          selectedSuggestionId={item.id}
          onApplySuggestion={onApplySuggestion}
        />
      ) : (
        (showConfidence || showHybrid) && (
          <div className={cx('selected-suggestion')}>
            {showConfidence && <ConfidenceScoreIndicator confidence={suggestRs.matchScore} compact />}
            {showHybrid && (
              <HybridSearchIndicator
                matchSource={suggestRs.matchSource}
                methodName={suggestRs.methodName}
                modelInfo={suggestRs.modelInfo}
              />
            )}
          </div>
        )
      )}
      <div className={cx('details-section')}>
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
      </div>
    </>
  );
};

MachineLearningSuggestions.propTypes = {
  modalState: PropTypes.object.isRequired,
  itemData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  eventsInfo: PropTypes.object,
  suggestedItems: PropTypes.array,
  onApplySuggestion: PropTypes.func,
};
