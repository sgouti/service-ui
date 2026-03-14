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
import { NOTIFICATION_TYPES, showNotification } from 'controllers/notification';
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

jest.mock('components/clusters', () => ({
  RootCauseClusterView: ({ clusters, loading, totalFailures }) => (
    <div
      className="root-cause-clusters-mock"
      data-count={clusters?.length || 0}
      data-loading={loading ? 'true' : 'false'}
      data-total-failures={totalFailures}
    />
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

jest.mock('controllers/notification', () => ({
  NOTIFICATION_TYPES: {
    INFO: 'info',
  },
  showNotification: jest.fn((payload) => ({ type: 'SHOW_NOTIFICATION', payload })),
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
  coverage: { coveragePercent: 88, autoAnalyzedItems: 24, nonPassedItems: 12, totalItems: 30 },
  comparison: {
    currentLaunchId: 101,
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
      totalRuns: 6,
      flakyTransitions: 3,
      flakyRate: 58,
      quarantined: true,
    },
    {
      itemId: 56,
      name: 'Profile update',
      currentStatus: 'FAILED',
      statusHistory: ['FAILED', 'FAILED', 'PASSED'],
      totalRuns: 5,
      flakyTransitions: 1,
      flakyRate: 34,
      quarantined: false,
    },
  ],
  triageAging: [{ label: 'breach', count: 3 }],
  releaseAggregate: [
    {
      id: 101,
      name: 'Regression',
      number: 55,
      values: {
        'statistics$executions$passed': 18,
        'statistics$executions$failed': 9,
        'statistics$executions$skipped': 3,
        'statistics$defects$to_investigate$total': 6,
      },
    },
  ],
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
    expect(normalizeChildren(wrapper.find('.tab-count').at(0).prop('children'))).toBe('2');

    await act(async () => {
      wrapper.find('.tab-button').at(1).prop('onClick')();
    });
    wrapper.update();

    expect(wrapper.find('.quarantine-row')).toHaveLength(2);
    expect(wrapper.find('.quarantine-summary .card-value').map((node) => normalizeChildren(node.prop('children')))).toEqual(
      expect.arrayContaining(['62.1%']),
    );
    expect(wrapper.find('.badge')).toHaveLength(2);
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
    expect(wrapper.find('.quarantine-row')).toHaveLength(2);
  });

  test('does not expose flakiness modal actions when flakiness is disabled', async () => {
    configureSelectors();
    useSelector.mockImplementation((selector) => {
      if (selector === projectKeySelector) {
        return 'demo';
      }
      if (selector === analyzerAttributesSelector) {
        return { flakinessBadgeEnabled: 'false' };
      }
      if (selector === querySelector) {
        return {};
      }
      if (selector === analyzerInsightsSelector) {
        return summary;
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

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsPage />);
      await Promise.resolve();
    });
    wrapper.update();

    await act(async () => {
      wrapper.find('.tab-button').at(1).prop('onClick')();
    });
    wrapper.update();

    expect(wrapper.find('.badge')).toHaveLength(0);
    expect(wrapper.findWhere((node) => node.type() === 'button' && node.prop('aria-label') && String(node.prop('aria-label')).includes('Flakiness Details'))).toHaveLength(0);
  });

  test('renders no launches empty state when backend returns an empty insights payload', async () => {
    configureSelectors({ insightsSummary: { recentLaunches: [] } });

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsPage />);
      await Promise.resolve();
    });
    wrapper.update();

    expect(normalizeChildren(wrapper.find('.empty-state').prop('children'))).toBe(
      'No launches are available for analyzer insights.',
    );
  });

  test('shows analyzing notification when insights loading takes longer than the threshold', async () => {
    jest.useFakeTimers();
    useSelector.mockImplementation((selector) => {
      if (selector === projectKeySelector) {
        return 'demo';
      }
      if (selector === analyzerAttributesSelector) {
        return {};
      }
      if (selector === querySelector) {
        return {};
      }
      if (selector === analyzerInsightsSelector) {
        return summary;
      }
      if (selector === analyzerInsightsLoadingSelector) {
        return true;
      }
      if (selector === analyzerInsightsClustersSelector) {
        return [];
      }
      if (selector === analyzerInsightsClustersLoadingSelector) {
        return false;
      }
      return undefined;
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<AnalyzerInsightsPage />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });
    wrapper.update();

    expect(showNotification).toHaveBeenCalledWith({
      message: 'Analyzing launch insights',
      type: NOTIFICATION_TYPES.INFO,
      duration: 2500,
    });

    jest.useRealTimers();
  });
});