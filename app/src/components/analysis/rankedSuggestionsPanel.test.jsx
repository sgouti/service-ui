import React from 'react';
import { mount } from 'enzyme';
import { RankedSuggestionsPanel } from './rankedSuggestionsPanel';

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

const suggestions = [
  {
    testItemResource: {
      id: 1,
      name: 'Session timeout',
      issue: { issueType: 'ab001' },
      launchName: 'Sprint 41',
    },
    suggestRs: { matchScore: 87, matchSource: 'semantic', methodName: 'semantic' },
  },
  {
    testItemResource: {
      id: 2,
      name: '401 on checkout',
      issue: { issueType: 'pb001' },
      launchName: 'Sprint 39',
    },
    suggestRs: { matchScore: 61, matchSource: 'keyword', methodName: 'keyword' },
  },
  {
    testItemResource: {
      id: 3,
      name: 'Staging env var',
      issue: { issueType: 'si001' },
      launchName: 'Sprint 37',
    },
    suggestRs: { matchScore: 45, matchSource: 'hybrid', methodName: 'hybrid' },
  },
  {
    testItemResource: {
      id: 4,
      name: 'Extra suggestion',
      issue: { issueType: 'nd001' },
      launchName: 'Sprint 36',
    },
    suggestRs: { matchScore: 30, matchSource: 'keyword', methodName: 'keyword' },
  },
];

describe('RankedSuggestionsPanel', () => {
  test('renders max 3 suggestions and exposes match-source tags', () => {
    const wrapper = mount(
      <RankedSuggestionsPanel suggestions={suggestions} selectedSuggestionId={1} onApplySuggestion={() => {}} />,
    );

    expect(wrapper.find('.card')).toHaveLength(3);
    expect(wrapper.find('.title').map((node) => node.prop('children'))).toEqual([
      'Automation Bug',
      'Product Bug',
      'System Issue',
    ]);
    expect(wrapper.find('.tag').map((node) => node.prop('children'))).toEqual([
      'semantic',
      'keyword',
      'hybrid',
    ]);
  });

  test('apply button triggers selection callback with suggestion payload', () => {
    const onApplySuggestion = jest.fn();
    const wrapper = mount(
      <RankedSuggestionsPanel
        suggestions={suggestions}
        selectedSuggestionId={null}
        onApplySuggestion={onApplySuggestion}
      />,
    );

    wrapper.find('.applyButton').at(1).prop('onClick')();

    expect(onApplySuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ testItemResource: expect.objectContaining({ id: 2 }) }),
    );
  });
});
