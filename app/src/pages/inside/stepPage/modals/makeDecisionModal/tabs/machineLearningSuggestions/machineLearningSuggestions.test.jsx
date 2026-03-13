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

  return mount(
    <MachineLearningSuggestions
      modalState={{
        suggestChoice: {
          logs: [],
          suggestRs: {
            matchScore: 91,
            resultPosition: 2,
            esPosition: 4,
            methodName: 'hybrid',
            modelInfo: 'bge-m3',
            esScore: 0.9134,
            relevantLogId: 17,
            ...suggestRs,
          },
        },
      }}
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

  test('renders confidence, rank, and hybrid retrieval summary when enabled', () => {
    const wrapper = createWrapper({
      [CONFIDENCE_SCORE_ENABLED]: 'true',
      [RANKED_SUGGESTIONS_ENABLED]: 'true',
      [HYBRID_SEARCH_INDICATOR_ENABLED]: 'true',
    });

    const labels = wrapper.find('.summary-label').map((node) => node.prop('children'));
    const values = wrapper
      .find('.summary-value')
      .map((node) => node.prop('children'))
      .map((value) => (Array.isArray(value) ? value.join('') : String(value)));

    expect(labels).toEqual(
      expect.arrayContaining([
        'Confidence',
        'Rank',
        'Keyword Rank',
        'Retrieval',
        'Semantic Score',
        'Model',
      ]),
    );
    expect(values).toEqual(
      expect.arrayContaining(['High', '#2', '#4', 'Hybrid', '0.913', 'bge-m3']),
    );
  });

  test('hides summary metadata when all analyzer insight flags are disabled', () => {
    const wrapper = createWrapper({
      [CONFIDENCE_SCORE_ENABLED]: 'false',
      [RANKED_SUGGESTIONS_ENABLED]: 'false',
      [HYBRID_SEARCH_INDICATOR_ENABLED]: 'false',
    });

    expect(wrapper.find('.summary-card')).toHaveLength(0);
    expect(wrapper.find('.summary-note')).toHaveLength(0);
    expect(wrapper.find('.test-item-details')).toHaveLength(1);
  });
});