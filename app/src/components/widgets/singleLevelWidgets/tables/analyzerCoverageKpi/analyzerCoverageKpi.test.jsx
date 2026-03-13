import React from 'react';
import { mount } from 'enzyme';
import { AnalyzerCoverageKpi } from './analyzerCoverageKpi';

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  injectIntl: (Component) => Component,
}));

const intl = {
  formatMessage: ({ defaultMessage }, values = {}) =>
    Object.entries(values).reduce(
      (message, [key, value]) => message.replace(`{${key}}`, value),
      defaultMessage,
    ),
};

const normalizeChildren = (value) => (Array.isArray(value) ? value.join('') : String(value));

describe('AnalyzerCoverageKpi', () => {
  test('renders missing sprint empty state with documentation link', () => {
    const wrapper = mount(
      <AnalyzerCoverageKpi
        intl={intl}
        widget={{
          content: {
            missingSprintAttribute: true,
          },
        }}
      />,
    );

    expect(wrapper.find('.empty-state')).toHaveLength(1);
    expect(wrapper.find('.empty-link').prop('href')).toContain('ProjectConfiguration');
  });

  test('renders coverage delta and trend stats', () => {
    const wrapper = mount(
      <AnalyzerCoverageKpi
        intl={intl}
        widget={{
          content: {
            currentSprint: {
              coveragePercent: 93,
              avgConfidence: 87,
              manualTriagePercent: 7,
              totalItems: 200,
              autoClassified: 186,
            },
            previousSprint: {
              coveragePercent: 65,
            },
            trend: 'IMPROVING',
          },
        }}
      />,
    );

    expect(wrapper.find('.hero-value').prop('children')).toBe('93%');
    expect(normalizeChildren(wrapper.find('.delta').prop('children'))).toContain('+28');
    expect(wrapper.find('.delta').prop('className')).toContain('positive');
    expect(wrapper.find('.stat-row').at(0).find('span').at(1).prop('children')).toBe('87%');
    expect(normalizeChildren(wrapper.find('.stat-row').at(1).find('span').at(1).prop('children'))).toBe(
      '7% (14 of 200 items)',
    );
    expect(normalizeChildren(wrapper.find('.trend').prop('children'))).toBe('IMPROVING ^');
  });
});