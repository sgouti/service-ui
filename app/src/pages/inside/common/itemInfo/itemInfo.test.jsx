import React from 'react';
import { mount } from 'enzyme';
import { ItemInfo } from './itemInfo';

const mockFlakinessBadge = jest.fn(() => <div className="flakiness-badge-mock" />);

jest.mock('react-intl', () => ({
  injectIntl: (Component) => Component,
  defineMessages: (messages) => messages,
}));

jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

jest.mock('react-tracking', () => () => (Component) => Component);

jest.mock('controllers/testItem', () => ({
  isStepLevelSelector: jest.fn(),
  formatItemName: (name) => name,
  getItemLevel: (type) => type,
}));

jest.mock('html-react-parser', () => jest.fn(() => null));

jest.mock('pages/inside/common/nameLink', () => ({
  NameLink: ({ children }) => <div className="name-link-mock">{children}</div>,
}));

jest.mock('pages/inside/common/durationBlock', () => ({
  DurationBlock: () => <div className="duration-block-mock" />,
}));

jest.mock('components/main/tooltips/tooltip', () => ({
  withTooltip: () => (Component) => Component,
}));

jest.mock('components/main/tooltips/textTooltip', () => ({
  TextTooltip: () => <div className="text-tooltip-mock" />,
}));

jest.mock('components/main/markdown', () => ({
  MarkdownViewer: ({ value }) => <div className="markdown-viewer-mock">{value}</div>,
}));

jest.mock('components/main/analytics/events', () => ({
  LAUNCHES_PAGE_EVENTS: {
    CLICK_ITEM_NAME: 'CLICK_ITEM_NAME',
  },
}));

jest.mock('components/extensionLoader', () => ({
  ExtensionLoader: () => <div className="extension-loader-mock" />,
  extensionType: require('prop-types').any,
}));

jest.mock('./attributesBlock', () => ({
  AttributesBlock: () => <div className="attributes-block-mock" />,
}));

jest.mock('./ownerBlock', () => ({
  OwnerBlock: () => <div className="owner-block-mock" />,
}));

jest.mock('./retriesCounter', () => ({
  RetriesCounter: () => <div className="retries-counter-mock" />,
}));

jest.mock('components/flakiness', () => ({
  FlakinessBadge: (props) => mockFlakinessBadge(props),
}));

const createProps = (overrides = {}) => ({
  intl: {
    formatMessage: ({ defaultMessage }) => defaultMessage,
  },
  sauceLabsIntegrations: [],
  value: {
    id: 11,
    name: 'Checkout flow',
    type: 'TEST',
    status: 'FAILED',
    hasChildren: false,
    hasStats: true,
  },
  refFunction: null,
  customProps: {
    ownLinkParams: {},
    onEditItem: jest.fn(),
    onClickAttribute: jest.fn(),
    onOwnerClick: jest.fn(),
    events: {},
    withExtensions: false,
    parentLaunch: {
      id: 101,
      status: 'passed',
    },
  },
  isStepLevel: false,
  hideEdit: false,
  extensions: [],
  analyzerAttributes: {
    insightsPageEnabled: 'true',
    flakinessBadgeEnabled: 'true',
  },
  organizationAndProject: {
    organizationSlug: 'org',
    projectSlug: 'proj',
  },
  tracking: {
    trackEvent: jest.fn(),
    getTrackingData: jest.fn(),
  },
  onClickRetries: jest.fn(),
  hideDescription: true,
  ...overrides,
});

describe('ItemInfo flakiness badge gating', () => {
  beforeEach(() => {
    mockFlakinessBadge.mockClear();
  });

  test('enables flakiness badge for completed leaf test items', () => {
    mount(<ItemInfo {...createProps()} />);

    expect(mockFlakinessBadge).toHaveBeenCalled();
    expect(mockFlakinessBadge.mock.calls[0][0].enabled).toBe(true);
    expect(Boolean(mockFlakinessBadge.mock.calls[0][0].onOpenInsights)).toBe(true);
  });

  test('disables flakiness badge for suite-like rows with children', () => {
    mount(
      <ItemInfo
        {...createProps({
          value: {
            id: 12,
            name: 'Checkout suite',
            type: 'SUITE',
            hasChildren: true,
            hasStats: true,
            status: 'FAILED',
          },
        })}
      />,
    );

    expect(mockFlakinessBadge).toHaveBeenCalled();
    expect(mockFlakinessBadge.mock.calls[0][0].enabled).toBe(false);
  });

  test('disables flakiness badge for suite rows without children', () => {
    mount(
      <ItemInfo
        {...createProps({
          value: {
            id: 13,
            name: 'Checkout suite leaf',
            type: 'SUITE',
            hasChildren: false,
            hasStats: true,
            status: 'FAILED',
          },
        })}
      />,
    );

    expect(mockFlakinessBadge).toHaveBeenCalled();
    expect(mockFlakinessBadge.mock.calls[0][0].enabled).toBe(false);
  });

  test('disables flakiness badge for step-level rows and launches still in progress', () => {
    mount(
      <ItemInfo
        {...createProps({
          isStepLevel: true,
          customProps: {
            ...createProps().customProps,
            parentLaunch: {
              id: 101,
              status: 'in_progress',
            },
          },
        })}
      />,
    );

    expect(mockFlakinessBadge).toHaveBeenCalled();
    expect(mockFlakinessBadge.mock.calls[0][0].enabled).toBe(false);
    expect(Boolean(mockFlakinessBadge.mock.calls[0][0].onOpenInsights)).toBe(false);
  });
});
