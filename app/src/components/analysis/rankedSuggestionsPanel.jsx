import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames/bind';
import { ConfidenceScoreIndicator } from './confidenceScoreIndicator';
import { HybridSearchIndicator } from './hybridSearchIndicator';
import { getConfidenceTone, getDefectTypeLabel, getMatchedLaunchLabel } from './utils';
import styles from './rankedSuggestionsPanel.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  matched: {
    id: 'RankedSuggestionsPanel.matched',
    defaultMessage: 'Matched: "{value}"',
  },
  apply: {
    id: 'RankedSuggestionsPanel.apply',
    defaultMessage: 'Apply this decision',
  },
  active: {
    id: 'RankedSuggestionsPanel.active',
    defaultMessage: 'Active suggestion',
  },
});

const getFilledDots = (score) => {
  const numericScore = Math.max(0, Math.min(100, Number(score) || 0));
  return Math.max(1, Math.round(numericScore / 20));
};

export const RankedSuggestionsPanel = ({
  suggestions = [],
  selectedSuggestionId = null,
  onApplySuggestion = () => {},
  limit = 3,
}) => {
  const { formatMessage } = useIntl();

  const rankedSuggestions = useMemo(
    () =>
      [...suggestions]
        .sort(
          (left, right) =>
            (Number(right?.suggestRs?.matchScore) || 0) - (Number(left?.suggestRs?.matchScore) || 0),
        )
        .slice(0, limit),
    [limit, suggestions],
  );

  if (!rankedSuggestions.length) {
    return null;
  }

  return (
    <div className={cx('panel')}>
      {rankedSuggestions.map((suggestion, index) => {
        const { testItemResource = {}, suggestRs = {} } = suggestion;
        const suggestionId = testItemResource.id;
        const isSelected = selectedSuggestionId === suggestionId;
        const confidenceTone = getConfidenceTone(suggestRs.matchScore);
        const filledDots = getFilledDots(suggestRs.matchScore);
        const defectTypeLabel = getDefectTypeLabel(testItemResource.issue?.issueType);
        const matchedLaunch = getMatchedLaunchLabel(testItemResource, suggestRs);

        return (
          <div
            key={suggestionId || index}
            className={cx('card', {
              cardSelected: isSelected,
              cardLowConfidence: confidenceTone === 'warning' || confidenceTone === 'critical',
            })}
          >
            <div className={cx('header')}>
              <div className={cx('rank')}>{index + 1}</div>
              <div>
                <div className={cx('title')}>{defectTypeLabel}</div>
                <div className={cx('subtitle')}>
                  {formatMessage(messages.matched, { value: testItemResource.name || 'Historical item' })}
                </div>
              </div>
              <div className={cx('scoreDots')} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={cx('scoreDot', { scoreDotFilled: dot < filledDots })}
                  />
                ))}
              </div>
            </div>
            <div className={cx('meta')}>
              <ConfidenceScoreIndicator
                confidence={Number(suggestRs.matchScore) || 0}
                matchedLaunch={matchedLaunch}
                compact
              />
              <HybridSearchIndicator
                matchSource={suggestRs.matchSource}
                methodName={suggestRs.methodName}
                modelInfo={suggestRs.modelInfo}
              />
            </div>
            <div className={cx('actions')}>
              <button
                type="button"
                className={cx('applyButton', { applyButtonSelected: isSelected })}
                aria-label={isSelected ? formatMessage(messages.active) : formatMessage(messages.apply)}
                onClick={() => onApplySuggestion(suggestion)}
              >
                {formatMessage(messages.apply)}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

RankedSuggestionsPanel.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.object),
  selectedSuggestionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onApplySuggestion: PropTypes.func,
  limit: PropTypes.number,
};
