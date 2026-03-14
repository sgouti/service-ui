import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react';
import { useDispatch } from 'react-redux';
import { fetch } from 'common/utils';
import { RootCauseClusterView } from './rootCauseClusterView';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
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

jest.mock('controllers/step', () => ({
  editDefect: jest.fn((items, meta) => ({ type: 'EDIT_DEFECT', payload: { items, meta } })),
  linkIssue: jest.fn((items, meta) => ({ type: 'LINK_ISSUE', payload: { items, meta } })),
}));

jest.mock('pages/inside/common/nameLink', () => ({
  NameLink: ({ children, className }) => <a className={className}>{children}</a>,
}));

const clusters = [
  { id: 2, matchedTests: 3, message: 'Secondary timeout\nMore details' },
  { id: 1, matchedTests: 7, message: 'Primary timeout\nPool exhausted' },
];

describe('RootCauseClusterView', () => {
  const dispatch = jest.fn();
  const normalizeChildren = (value) => (Array.isArray(value) ? value.join('') : String(value));
  const getClusterCard = (wrapper, index = 0) => wrapper.find('.cluster-card').at(index);
  const getActionButtons = (wrapper, index = 0) => getClusterCard(wrapper, index).find('button');

  beforeEach(() => {
    useDispatch.mockReturnValue(dispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sorts clusters by matched tests descending and shows threshold empty state', () => {
    const wrapper = mount(
      <RootCauseClusterView clusters={clusters} projectKey="demo" launchId={101} totalFailures={10} />,
    );

    expect(wrapper.find('.cluster-card-title').at(0).prop('children')).toBe('Primary timeout');

    const emptyWrapper = mount(
      <RootCauseClusterView clusters={[]} projectKey="demo" launchId={101} totalFailures={3} />,
    );
    expect(normalizeChildren(emptyWrapper.find('.empty-state').at(0).prop('children'))).toContain(
      'Clustering requires 10+ failures.',
    );
  });

  test('expands cluster items and loads more items', async () => {
    fetch
      .mockResolvedValueOnce({
        content: [{ id: 11, launchId: 101, path: '1.2', name: 'Test A', status: 'FAILED' }],
        page: { number: 1, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        content: [{ id: 12, launchId: 101, path: '1.3', name: 'Test B', status: 'FAILED' }],
        page: { number: 2, totalPages: 2 },
      });

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RootCauseClusterView clusters={clusters} projectKey="demo" launchId={101} totalFailures={10} />,
      );
    });
    wrapper.update();

    await act(async () => {
      getActionButtons(wrapper, 0).at(1).prop('onClick')();
      await Promise.resolve();
    });
    wrapper.update();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.cluster-item-row')).toHaveLength(1);

    await act(async () => {
      wrapper.find('.load-more-button').at(0).prop('onClick')();
      await Promise.resolve();
    });
    wrapper.update();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.cluster-item-row')).toHaveLength(2);
  });

  test('opens bulk actions with fetched cluster items', async () => {
    fetch.mockResolvedValue({
      content: [{ id: 11, launchId: 101, path: '1.2', name: 'Test A', status: 'FAILED', issue: {} }],
      page: { number: 1, totalPages: 1 },
    });

    const { editDefect, linkIssue } = require('controllers/step');

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RootCauseClusterView clusters={clusters} projectKey="demo" launchId={101} totalFailures={10} />,
      );
    });
    wrapper.update();

    await act(async () => {
      getActionButtons(wrapper, 0).at(2).prop('onClick')();
      await Promise.resolve();
    });
    wrapper.update();

    expect(editDefect).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'EDIT_DEFECT' }));

    await act(async () => {
      getActionButtons(wrapper, 0).at(0).prop('onClick')();
      await Promise.resolve();
    });
    wrapper.update();

    expect(linkIssue).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'LINK_ISSUE' }));
  });
});