import React from 'react';
import { act } from 'react';
import { mount } from 'enzyme';
import { useSelector } from 'react-redux';
import { fetch } from 'common/utils';
import { projectKeySelector } from 'controllers/project';
import { FlakinessBadge } from './flakinessBadge';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  useIntl: () => ({
    formatMessage: ({ defaultMessage }) => defaultMessage,
  }),
  injectIntl: (Component) => (props) => (
    <Component
      {...props}
      intl={{
        formatMessage: ({ defaultMessage }) => defaultMessage,
      }}
    />
  ),
}));

jest.mock('common/utils', () => ({
  fetch: jest.fn(),
}));

jest.mock('controllers/project', () => ({
  projectKeySelector: jest.fn(),
}));

jest.mock('common/hooks/useOnClickOutside', () => ({
  useOnClickOutside: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));
const normalizeChildren = (value) => (Array.isArray(value) ? value.join('') : String(value));

describe('FlakinessBadge', () => {
  beforeEach(() => {
    useSelector.mockImplementation((selector) => {
      if (selector === projectKeySelector) {
        return 'demo';
      }
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders a badge and opens detail panel with fetched history', async () => {
    fetch.mockResolvedValueOnce({
      flakyRate: 58,
      totalRuns: 12,
      flakyTransitions: 4,
      quarantined: true,
      lastStatusChange: '2026-03-14T10:00:00.000Z',
      history: [
        {
          launchId: 7,
          launchName: 'Regression',
          status: 'FAILED',
          startTime: '2026-03-14T09:00:00.000Z',
        },
      ],
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(normalizeChildren(wrapper.find('.badge-label').prop('children'))).toBe('FLAKY');
    expect(normalizeChildren(wrapper.find('.badge-score').prop('children'))).toBe('58');

    await act(async () => {
      wrapper.find('button').at(0).prop('onClick')();
    });
    wrapper.update();

    expect(wrapper.find('[role="dialog"]')).toHaveLength(1);
    expect(normalizeChildren(wrapper.find('.detail-title').prop('children'))).toBe('Flakiness details');
    expect(normalizeChildren(wrapper.find('.detail-subtitle').prop('children'))).toBe('Checkout flow');
    expect(normalizeChildren(wrapper.find('.detail-history-primary').at(0).prop('children'))).toBe(
      'Regression',
    );
  });

  test('fails silently when no score is returned', async () => {
    fetch.mockResolvedValueOnce({
      history: [],
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(wrapper.isEmptyRender()).toBe(true);
  });

  test('renders deterministic unstable badge without a numeric score for short mixed history', async () => {
    fetch.mockResolvedValueOnce({
      label: 'UNSTABLE',
      totalRuns: 4,
      flakyTransitions: 2,
      history: [],
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(normalizeChildren(wrapper.find('.badge-label').prop('children'))).toBe('UNSTABLE');
    expect(wrapper.find('.badge-score')).toHaveLength(0);
  });

  test('fails silently when short stable history has no backend label', async () => {
    fetch.mockResolvedValueOnce({
      totalRuns: 4,
      history: [],
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(wrapper.isEmptyRender()).toBe(true);
  });

  test('fails silently when analyzer flakiness endpoint is unsupported', async () => {
    fetch.mockRejectedValueOnce({
      statusCode: 404,
      message: 'Not Found',
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    wrapper.update();

    expect(wrapper.isEmptyRender()).toBe(true);
  });

  test('does not suppress later badges for the whole project after one unsupported response', async () => {
    fetch
      .mockRejectedValueOnce({
        statusCode: 404,
        message: 'Not Found',
      })
      .mockResolvedValueOnce({
        flakyRate: 58,
        totalRuns: 12,
        flakyTransitions: 4,
        history: [],
      });

    let firstWrapper;
    await act(async () => {
      firstWrapper = mount(<FlakinessBadge itemId={5} itemName="Checkout flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    firstWrapper.update();

    let secondWrapper;
    await act(async () => {
      secondWrapper = mount(<FlakinessBadge itemId={6} itemName="Profile flow" enabled />);
      await flushPromises();
      await flushPromises();
    });
    secondWrapper.update();

    expect(firstWrapper.isEmptyRender()).toBe(true);
    expect(normalizeChildren(secondWrapper.find('.badge-label').prop('children'))).toBe('FLAKY');
  });
});