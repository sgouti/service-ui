import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react';
import { useSelector } from 'react-redux';
import { fetch } from 'common/utils';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import {
  INSIGHTS_PAGE_ENABLED,
  RELEASE_AGGREGATE_ENABLED,
} from 'pages/inside/projectSettingsPageContainer/content/analyzerContainer/constants';
import { ReleaseInsightsTab } from './releaseInsightsTab';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }, values = {}) =>
      Object.entries(values).reduce(
        (message, [key, value]) => message.replace(`{${key}}`, value),
        defaultMessage,
      ),
  }),
  defineMessages: (messages) => messages,
}));

jest.mock('common/utils', () => ({
  fetch: jest.fn(),
}));

jest.mock('controllers/project', () => ({
  analyzerAttributesSelector: jest.fn(),
  projectKeySelector: jest.fn(),
}));

jest.mock('components/preloaders/spinningPreloader', () => ({
  SpinningPreloader: () => <div className="spinner">Loading</div>,
}));

const mountComponent = async (attributes) => {
  useSelector.mockImplementation((selector) => {
    if (selector === projectKeySelector) {
      return 'demo';
    }
    if (selector === analyzerAttributesSelector) {
      return attributes;
    }
    return undefined;
  });

  let wrapper;
  await act(async () => {
    wrapper = mount(<ReleaseInsightsTab />);
    await Promise.resolve();
  });
  wrapper.update();
  return wrapper;
};

describe('ReleaseInsightsTab', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders disabled state when release insights are turned off', async () => {
    const wrapper = await mountComponent({
      [INSIGHTS_PAGE_ENABLED]: 'true',
      [RELEASE_AGGREGATE_ENABLED]: 'false',
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.find('.product-versions-page__empty').prop('children')).toBe(
      'Release insights are disabled in analyzer settings.',
    );
  });

  test('loads and renders release aggregate rows when enabled', async () => {
    fetch.mockResolvedValue({
      coverage: {
        coveragePercent: 88,
      },
      quarantine: [{ itemId: 1 }, { itemId: 2 }],
      releaseAggregate: [
        {
          id: 12,
          name: 'Release 3.2',
          number: 44,
          startTime: '2026-03-14T10:00:00.000Z',
          values: {
            'statistics$executions$passed': 10,
            'statistics$executions$failed': 2,
            'statistics$executions$skipped': 1,
            'statistics$defects$to_investigate$total': 3,
          },
        },
      ],
    });

    const wrapper = await mountComponent({
      [INSIGHTS_PAGE_ENABLED]: 'true',
      [RELEASE_AGGREGATE_ENABLED]: 'true',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.product-versions-page__insights-title').prop('children')).toBe(
      'Release insights',
    );
    expect(wrapper.find('.product-versions-page__summary-value').at(0).prop('children')).toEqual([
      88,
      '%',
    ]);
    expect(wrapper.find('.product-versions-page__summary-value').at(1).prop('children')).toBe(2);
    expect(wrapper.find('.product-versions-page__launch-name').at(0).children().at(0).text()).toBe(
      'Release 3.2',
    );
    expect(wrapper.find('tbody tr')).toHaveLength(1);
  });
});