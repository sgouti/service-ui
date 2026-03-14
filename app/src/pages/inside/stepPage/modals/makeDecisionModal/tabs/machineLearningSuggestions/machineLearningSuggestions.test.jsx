import React from 'react';
import { mount } from 'enzyme';
import { useSelector } from 'react-redux';
import {
  CONFIDENCE_SCORE_ENABLED,
  HYBRID_SEARCH_INDICATOR_ENABLED,
  RANKED_SUGGESTIONS_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import { MachineLearningSuggestions } from './machineLearningSuggestions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

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

jest.mock('react-tracking', () => ({
  useTracking: () => ({
    trackEvent: jest.fn(),
  }),
}));

jest.mock('../../elements/testItemDetails', () => ({
  TestItemDetails: () => <div className="test-item-details">Test item details</div>,
}));

const createWrapper = (attributes, suggestRs = {}) => {
  useSelector.mockImplementation(() => attributes);

  const suggestedItems = [
    {
      testItemResource: {
        id: 77,
        name: 'Timeout in checkout',
        issue: { issueType: 'ab001' },
        launchName: 'Sprint 41',
      },
      suggestRs: {
        matchScore: 91,
        matchSource: 'hybrid',
        methodName: 'hybrid',
      },
    },
    {
      testItemResource: {
        id: 78,
        name: '401 in checkout',
        issue: { issueType: 'pb001' },
        launchName: 'Sprint 39',
      },
      suggestRs: {
        matchScore: 63,
        matchSource: 'keyword',
        methodName: 'keyword',
      },
    },
  ];

  return mount(
    <MachineLearningSuggestions
      modalState={{
        suggestChoice: {
          id: 77,
          logs: [],
          suggestRs: {
            matchScore: 91,
            resultPosition: 2,
            esPosition: 4,
            methodName: 'hybrid',
            matchSource: 'hybrid',
            modelInfo: 'bge-m3',
            esScore: 0.9134,
            relevantLogId: 17,
            ...suggestRs,
          },
        },
      }}
      suggestedItems={suggestedItems}
      onApplySuggestion={jest.fn()}
      itemData={{
        issue: {
          issueType: 'ti001',
        },
      }}
      eventsInfo={{
        getClickItemLinkEvent: jest.fn(() => ({})),
        getOpenStackTraceEvent: jest.fn(() => ({})),
      }}
    />,
  );
};

describe('MachineLearningSuggestions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders ranked suggestions panel when analyzer insight flags are enabled', () => {
    const wrapper = createWrapper({
      [CONFIDENCE_SCORE_ENABLED]: 'true',
      [RANKED_SUGGESTIONS_ENABLED]: 'true',
      [HYBRID_SEARCH_INDICATOR_ENABLED]: 'true',
    });

    expect(wrapper.find('.card')).toHaveLength(2);
    expect(wrapper.find('.tag').map((node) => node.prop('children'))).toEqual([
      'hybrid',
      'keyword',
    ]);
    expect(wrapper.find('.test-item-details')).toHaveLength(1);
  });

  test('hides summary metadata when all analyzer insight flags are disabled', () => {
    const wrapper = createWrapper({
      [CONFIDENCE_SCORE_ENABLED]: 'false',
      [RANKED_SUGGESTIONS_ENABLED]: 'false',
      [HYBRID_SEARCH_INDICATOR_ENABLED]: 'false',
    });

    expect(wrapper.find('.card')).toHaveLength(0);
    expect(wrapper.find('.summary-note')).toHaveLength(0);
    expect(wrapper.find('.test-item-details')).toHaveLength(1);
  });
});