import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { reduxForm } from 'redux-form';
import { Button, Checkbox } from '@reportportal/ui-kit';
import { COMMON_LOCALE_KEYS } from 'common/constants/localization';
import { FIELD } from 'common/constants/dataAutomation';
import classNames from 'classnames/bind';
import { Layout } from '../../layout';
import { FieldElement, LabeledPreloader } from '../../elements';
import {
  CONFIDENCE_SCORE_ENABLED,
  COVERAGE_KPI_ENABLED,
  FLAKINESS_BADGE_ENABLED,
  HYBRID_SEARCH_INDICATOR_ENABLED,
  INSIGHTS_PAGE_ENABLED,
  LAUNCH_COMPARISON_ENABLED,
  QUARANTINE_TAB_ENABLED,
  RANKED_SUGGESTIONS_ENABLED,
  RELEASE_AGGREGATE_ENABLED,
  ROOT_CAUSE_CLUSTERS_ENABLED,
  TRIAGE_AGING_ENABLED,
} from '../constants';
import { messages } from './messages';
import styles from './insights.scss';

const cx = classNames.bind(styles);

const FIELDS = [
  {
    key: INSIGHTS_PAGE_ENABLED,
    label: messages.insightsPage,
    description: messages.insightsPageDescription,
  },
  {
    key: FLAKINESS_BADGE_ENABLED,
    label: messages.flakinessBadge,
    description: messages.flakinessBadgeDescription,
  },
  {
    key: QUARANTINE_TAB_ENABLED,
    label: messages.quarantineTab,
    description: messages.quarantineTabDescription,
  },
  {
    key: CONFIDENCE_SCORE_ENABLED,
    label: messages.confidenceScore,
    description: messages.confidenceScoreDescription,
  },
  {
    key: RANKED_SUGGESTIONS_ENABLED,
    label: messages.rankedSuggestions,
    description: messages.rankedSuggestionsDescription,
  },
  {
    key: ROOT_CAUSE_CLUSTERS_ENABLED,
    label: messages.rootCauseClusters,
    description: messages.rootCauseClustersDescription,
  },
  {
    key: TRIAGE_AGING_ENABLED,
    label: messages.triageAging,
    description: messages.triageAgingDescription,
  },
  {
    key: COVERAGE_KPI_ENABLED,
    label: messages.coverageKpi,
    description: messages.coverageKpiDescription,
  },
  {
    key: RELEASE_AGGREGATE_ENABLED,
    label: messages.releaseAggregate,
    description: messages.releaseAggregateDescription,
  },
  {
    key: LAUNCH_COMPARISON_ENABLED,
    label: messages.launchComparison,
    description: messages.launchComparisonDescription,
  },
  {
    key: HYBRID_SEARCH_INDICATOR_ENABLED,
    label: messages.hybridSearchIndicator,
    description: messages.hybridSearchIndicatorDescription,
  },
];

export const Insights = ({ analyzerConfig, initialize, handleSubmit, onFormSubmit, hasPermission }) => {
  const { formatMessage } = useIntl();
  const [isPending, setPending] = useState(false);

  useEffect(() => {
    initialize(
      FIELDS.reduce(
        (acc, field) => ({
          ...acc,
          [field.key]: analyzerConfig[field.key] !== 'false',
        }),
        {},
      ),
    );
  }, []);

  const submitHandler = async (data) => {
    setPending(true);
    await onFormSubmit(data);
    setPending(false);
  };

  const disabled = !hasPermission || isPending;

  return (
    <Layout description={formatMessage(messages.tabDescription)}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div className={cx('grid')}>
          {FIELDS.map((field) => (
            <FieldElement
              key={field.key}
              name={field.key}
              description={formatMessage(field.description)}
              format={Boolean}
              disabled={disabled}
              dataAutomationId={field.key + FIELD}
            >
              <Checkbox>{formatMessage(field.label)}</Checkbox>
            </FieldElement>
          ))}
        </div>
        {hasPermission && (
          <Button type="submit" disabled={disabled} data-automation-id="submitButton">
            {formatMessage(COMMON_LOCALE_KEYS.SUBMIT)}
          </Button>
        )}
        {isPending && <LabeledPreloader text={formatMessage(COMMON_LOCALE_KEYS.processData)} />}
      </form>
    </Layout>
  );
};

Insights.propTypes = {
  analyzerConfig: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  hasPermission: PropTypes.bool.isRequired,
  initialize: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
};

export default reduxForm({
  form: 'analyzerInsightsSettingsForm',
})(Insights);