import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react';
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
import { Insights } from './insights';

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  useIntl: () => ({
    formatMessage: ({ defaultMessage }, values = {}) =>
      Object.entries(values).reduce(
        (message, [key, value]) => message.replace(`{${key}}`, value),
        defaultMessage,
      ),
  }),
}));

jest.mock('@reportportal/ui-kit', () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
  Checkbox: ({ children }) => <span>{children}</span>,
}));

jest.mock('../../layout', () => ({
  Layout: ({ children, description }) => (
    <div>
      <div className="layout-description">{description}</div>
      {children}
    </div>
  ),
}));

jest.mock('../../elements', () => ({
  FieldElement: ({ children, name, description }) => (
    <div data-name={name}>
      <span>{description}</span>
      {children}
    </div>
  ),
  LabeledPreloader: ({ text }) => <div className="preloader">{text}</div>,
}));

const defaultValues = {
  [INSIGHTS_PAGE_ENABLED]: true,
  [FLAKINESS_BADGE_ENABLED]: false,
  [QUARANTINE_TAB_ENABLED]: true,
  [CONFIDENCE_SCORE_ENABLED]: true,
  [RANKED_SUGGESTIONS_ENABLED]: true,
  [ROOT_CAUSE_CLUSTERS_ENABLED]: true,
  [TRIAGE_AGING_ENABLED]: true,
  [COVERAGE_KPI_ENABLED]: true,
  [RELEASE_AGGREGATE_ENABLED]: true,
  [LAUNCH_COMPARISON_ENABLED]: true,
  [HYBRID_SEARCH_INDICATOR_ENABLED]: true,
};

const createWrapper = (props = {}) =>
  mount(
    <Insights
      analyzerConfig={{
        [FLAKINESS_BADGE_ENABLED]: 'false',
        [INSIGHTS_PAGE_ENABLED]: 'true',
      }}
      initialize={jest.fn()}
      handleSubmit={(callback) => (event) => {
        if (event && event.preventDefault) {
          event.preventDefault();
        }
        return callback(defaultValues);
      }}
      hasPermission
      onFormSubmit={jest.fn(() => Promise.resolve())}
      {...props}
    />,
  );

describe('Insights settings form', () => {
  test('initializes analyzer insight toggles from analyzerConfig with missing values defaulting to true', () => {
    const initialize = jest.fn();
    createWrapper({ initialize });

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        [INSIGHTS_PAGE_ENABLED]: true,
        [FLAKINESS_BADGE_ENABLED]: false,
        [QUARANTINE_TAB_ENABLED]: true,
        [HYBRID_SEARCH_INDICATOR_ENABLED]: true,
      }),
    );
  });

  test('submits updated values through onFormSubmit', async () => {
    const onFormSubmit = jest.fn(() => Promise.resolve());
    const wrapper = createWrapper({ onFormSubmit });

    await act(async () => {
      await wrapper.find('form').prop('onSubmit')({ preventDefault: jest.fn() });
    });
    wrapper.update();

    expect(onFormSubmit).toHaveBeenCalledWith(defaultValues);
  });
});