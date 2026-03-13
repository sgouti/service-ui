import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  analyzerInsightsClustersLoadingSelector,
  analyzerInsightsClustersSelector,
  analyzerInsightsLoadingSelector,
  analyzerInsightsSelector,
  fetchAnalyzerClustersAction,
  fetchAnalyzerInsightsAction,
} from 'controllers/analyzerInsights';
import { showModalAction } from 'controllers/modal';
import { analyzerAttributesSelector, projectKeySelector } from 'controllers/project';
import { querySelector } from 'controllers/pages';
import { AnalyzerInsightsPage } from './analyzerInsightsPage';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
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

jest.mock('@reportportal/ui-kit', () => ({
  Button: ({ children, ...rest }) => <button type="button" {...rest}>{children}</button>,
}));

jest.mock('layouts/pageLayout', () => ({
  PageLayout: ({ children }) => <div className="page-layout">{children}</div>,
  PageSection: ({ children }) => <div className="page-section">{children}</div>,
}));

jest.mock('components/preloaders/spinningPreloader', () => ({
  SpinningPreloader: () => <div className="spinner">Loading</div>,
}));

jest.mock('components/main/modal', () => ({
  ModalLayout: ({ children, title }) => (
    <div className="modal-layout">
      <div className="modal-title">{title}</div>
      {children}
    </div>
  ),
}));

jest.mock('components/flakiness', () => ({
  FlakinessDetailPanel: ({ itemName, details }) => (
    <div className="flakiness-panel-mock">
      <span className="item-name">{itemName}</span>
      <span className="score">{details?.flakyRate}</span>
    </div>
  ),
}));

jest.mock('common/utils', () => ({
  fetch: jest.fn(),
}));

jest.mock('controllers/analyzerInsights', () => ({
  analyzerInsightsSelector: jest.fn(),
  analyzerInsightsLoadingSelector: jest.fn(),
  analyzerInsightsClustersSelector: jest.fn(),
  analyzerInsightsClustersLoadingSelector: jest.fn(),
  fetchAnalyzerInsightsAction: jest.fn((payload) => ({ type: 'FETCH_ANALYZER_INSIGHTS', payload })),
  fetchAnalyzerClustersAction: jest.fn((payload) => ({ type: 'FETCH_ANALYZER_CLUSTERS', payload })),
}));

jest.mock('controllers/modal', () => ({
  showModalAction: jest.fn((payload) => ({ type: 'SHOW_MODAL', payload })),
}));

jest.mock('controllers/project', () => ({
  analyzerAttributesSelector: jest.fn(),
  projectKeySelector: jest.fn(),
}));

jest.mock('controllers/pages', () => ({
  querySelector: jest.fn(),
}));

const summary = {
  launchId: 101,
  coverage: { coveragePercent: 88, autoAnalyzedItems: 24, nonPassedItems: 30 },
  comparison: {
    baselineLaunchId: 77,
    metrics: [
      { field: 'statistics$executions$failed', label: 'Failed', baseline: 8, current: 5, delta: -3 },
      { field: 'statistics$defects$to_investigate$total', label: 'To Investigate', baseline: 4, current: 6, delta: 2 },
    ],
  },
  quarantine: [
    {
      itemId: 55,
      name: 'Checkout flow',
      currentStatus: 'FAILED',
      statusHistory: ['FAILED', 'PASSED', 'FAILED'],
      flakyRate: 58,
      quarantined: true,
    },
  ],
  triageAging: [{ label: 'breach', count: 3 }],
  releaseAggregate: [],
  recentLaunches: [
    { id: 101, name: 'Regression', number: 55 },
    { id: 77, name: 'Regression', number: 54 },
  ],
};

const configureSelectors = ({ query = {}, insightsSummary = summary } = {}) => {
  useSelector.mockImplementation((selector) => {
    if (selector === projectKeySelector) {
      return 'demo';
    }
    if (selector === analyzerAttributesSelector) {
      return {};
    }
    if (selector === querySelector) {
      return query;
    }
    if (selector === analyzerInsightsSelector) {
      return insightsSummary;
    }
    if (selector === analyzerInsightsLoadingSelector) {
      return false;
    }
    if (selector === analyzerInsightsClustersSelector) {
      return [{ id: 19, matchedTests: 4, message: 'DB timeout signature' }];
    }
    if (selector === analyzerInsightsClustersLoadingSelector) {
      return false;
    }
    return undefined;
  });
};

describe('AnalyzerInsightsPage', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    useDispatch.mockReturnValue(dispatch);
    configureSelectors();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const normalizeChildren = (value) => (Array.isArray(value) ? value.join('') : String(value));

  test('renders comparison metrics and quarantine candidates from analyzer summary', async () => {
    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsPage />);
      await Promise.resolve();
    });
    wrapper.update();

    expect(fetchAnalyzerClustersAction).toHaveBeenCalledWith({ launchId: 101 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'FETCH_ANALYZER_CLUSTERS', payload: { launchId: 101 } });
    expect(wrapper.find('.panel-title').map((node) => normalizeChildren(node.prop('children')))).toEqual(
      expect.arrayContaining(['Launch Comparison Diff']),
    );
    expect(wrapper.find('.metric-row')).toHaveLength(2);
    expect(wrapper.find('.quarantine-row')).toHaveLength(0);

    await act(async () => {
      wrapper.find('.tab-button').at(1).prop('onClick')();
    });
    wrapper.update();

    expect(wrapper.find('.quarantine-row')).toHaveLength(1);
  });

  test('opens flakiness details modal from deep link query', async () => {
    configureSelectors({
      query: {
        launchId: '101',
        itemId: '55',
        itemName: 'Checkout flow',
        tab: 'quarantine',
      },
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsPage />);
      await Promise.resolve();
      await Promise.resolve();
    });
    wrapper.update();

    expect(showModalAction).toHaveBeenCalledTimes(1);
    const modalPayload = showModalAction.mock.calls[0][0];
    expect(modalPayload.component).toBeTruthy();
    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', payload: modalPayload });
    expect(wrapper.find('.quarantine-row')).toHaveLength(1);
  });
});