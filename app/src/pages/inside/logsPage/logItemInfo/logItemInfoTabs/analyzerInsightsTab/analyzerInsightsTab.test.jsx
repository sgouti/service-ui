import React from 'react';
import { act } from 'react';
import { mount } from 'enzyme';
import { useSelector } from 'react-redux';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import { launchIdSelector } from 'controllers/pages';
import {
  FLAKINESS_BADGE_ENABLED,
  QUARANTINE_TAB_ENABLED,
  ROOT_CAUSE_CLUSTERS_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import { AnalyzerInsightsTab } from './analyzerInsightsTab';

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

jest.mock('common/utils', () => ({
  fetch: jest.fn(),
}));

jest.mock('controllers/project', () => ({
  analyzerAttributesSelector: jest.fn(),
  projectKeySelector: jest.fn(),
}));

jest.mock('controllers/pages', () => ({
  launchIdSelector: jest.fn(),
}));

jest.mock('controllers/testItem', () => ({
  PROVIDER_TYPE_CLUSTER: 'cluster',
}));

jest.mock('components/preloaders/spinningPreloader', () => ({
  SpinningPreloader: () => <div className="spinner">Loading</div>,
}));

const configureSelectors = (attributes) => {
  useSelector.mockImplementation((selector) => {
    if (selector === projectKeySelector) {
      return 'demo';
    }
    if (selector === launchIdSelector) {
      return 55;
    }
    if (selector === analyzerAttributesSelector) {
      return attributes;
    }
    return undefined;
  });
};

const normalizeChildren = (value) => (Array.isArray(value) ? value.join('') : String(value));
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AnalyzerInsightsTab', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = (...args) => {
      const [message] = args;
      if (
        typeof message === 'string' &&
        message.includes('not wrapped in act')
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  test('renders unavailable state when all analyzer features are disabled', () => {
    configureSelectors({
      [FLAKINESS_BADGE_ENABLED]: 'false',
      [QUARANTINE_TAB_ENABLED]: 'false',
      [ROOT_CAUSE_CLUSTERS_ENABLED]: 'false',
    });

    const wrapper = mount(<AnalyzerInsightsTab logItem={{ id: 5 }} />);

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.find('.empty-state').prop('children')).toBe(
      'Analyzer insights are disabled for this project.',
    );
  });

  test('loads flakiness and cluster details for the selected item', async () => {
    configureSelectors({
      [FLAKINESS_BADGE_ENABLED]: 'true',
      [QUARANTINE_TAB_ENABLED]: 'true',
      [ROOT_CAUSE_CLUSTERS_ENABLED]: 'true',
    });

    fetch
      .mockResolvedValueOnce({
        flakyRate: 50,
        totalRuns: 12,
        flakyTransitions: 4,
        quarantined: true,
        lastStatusChange: '2026-03-14T10:00:00.000Z',
        history: [
          {
            launchId: 7,
            itemId: 5,
            launchName: 'Regression',
            launchNumber: 44,
            status: 'FAILED',
            startTime: '2026-03-14T09:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        content: [{ id: 9, matchedTests: 3, message: 'DB timeout signature' }],
      })
      .mockResolvedValueOnce({
        content: [{ id: 5 }],
      });

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsTab logItem={{ id: 5 }} />);
    });
    await act(async () => {
      await Promise.all(fetch.mock.results.slice(0, 2).map((result) => result.value));
      await flushPromises();
      await flushPromises();
    });
    await act(async () => {
      await fetch.mock.results[2].value;
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith(URLS.analyzerItemFlakiness('demo', 5, { historyDepth: 10 }));
    expect(fetch).toHaveBeenCalledWith(
      URLS.clusterByLaunchId('demo', 55, { 'page.page': 1, 'page.size': 25 }),
    );
    expect(fetch).toHaveBeenCalledWith(URLS.testItemsWithProviderType('demo'), {
      params: {
        providerType: 'cluster',
        launchId: 55,
        'filter.any.clusterId': 9,
        'page.page': 1,
        'page.size': 25,
      },
    });
    expect(wrapper.find('.spinner')).toHaveLength(0);
    expect(normalizeChildren(wrapper.find('.value').at(0).prop('children'))).toBe('50%');
    expect(wrapper.find('.history-row')).toHaveLength(1);
    expect(wrapper.find('.cluster-row')).toHaveLength(1);
    expect(wrapper.find('.cluster-row').find('.muted').last().prop('children')).toBe(
      'DB timeout signature',
    );
  });

  test('shows unavailable state when analyzer endpoints fail', async () => {
    configureSelectors({
      [FLAKINESS_BADGE_ENABLED]: 'true',
      [QUARANTINE_TAB_ENABLED]: 'true',
      [ROOT_CAUSE_CLUSTERS_ENABLED]: 'true',
    });

    fetch.mockRejectedValueOnce({
      statusCode: 404,
      message: 'Not Found',
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsTab logItem={{ id: 5 }} />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(wrapper.find('.empty-state').last().prop('children')).toBe(
      'Analyzer service data is unavailable for this item.',
    );
  });
});