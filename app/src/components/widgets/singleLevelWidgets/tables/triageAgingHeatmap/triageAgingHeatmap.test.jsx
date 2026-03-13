import React from 'react';
import { act } from 'react';
import { mount } from 'enzyme';
import { TriageAgingHeatmap } from './triageAgingHeatmap';

jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

jest.mock('controllers/testItem', () => ({
  getLogItemLinkSelector: jest.fn(),
}));

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  injectIntl: (Component) => Component,
}));

jest.mock('pages/inside/common/userAvatar', () => ({
  UserAvatar: ({ userId }) => <div className="avatar">{userId}</div>,
}));

const intl = {
  formatMessage: ({ defaultMessage }, values = {}) =>
    Object.entries(values).reduce(
      (message, [key, value]) => message.replace(`{${key}}`, value),
      defaultMessage,
    ),
};

const widget = {
  content: {
    totalToInvestigate: 3,
    buckets: {
      fresh: { label: '0-24h', count: 1, items: [] },
      breach: {
        label: '7+ days',
        count: 2,
        items: [
          { itemId: 11, name: 'Critical timeout', ageHours: 192, path: '/item/11' },
          { itemId: 12, name: 'Login instability', ageHours: 176, analysisOwnerId: 'qa.lead' },
        ],
      },
    },
  },
};

describe('TriageAgingHeatmap', () => {
  test('renders empty state when there are no items in triage', () => {
    const wrapper = mount(
      <TriageAgingHeatmap
        intl={intl}
        isPreview
        widget={{ content: { totalToInvestigate: 0, buckets: {} } }}
        getLogItemLink={jest.fn()}
        navigate={jest.fn()}
      />,
    );

    expect(wrapper.find('.empty-state')).toHaveLength(1);
  });

  test('shows breach bucket details and navigates to item details on click', () => {
    const getLogItemLink = jest.fn((item) => ({ type: 'NAVIGATE', payload: item.itemId }));
    const navigate = jest.fn();
    const wrapper = mount(
      <TriageAgingHeatmap
        intl={intl}
        isPreview
        widget={widget}
        getLogItemLink={getLogItemLink}
        navigate={navigate}
      />,
    );

    act(() => {
      wrapper.instance().onBucketClick('breach');
    });
    wrapper.update();

    expect(wrapper.find('.summary').prop('className')).toContain('alert');
    expect(wrapper.find('.item-row')).toHaveLength(2);
    expect(wrapper.find('.unassigned')).toHaveLength(1);
    expect(wrapper.find('.avatar')).toHaveLength(1);

    wrapper.find('.item-link').at(0).prop('onClick')();

    expect(getLogItemLink).toHaveBeenCalledWith(widget.content.buckets.breach.items[0]);
    expect(navigate).toHaveBeenCalledWith({ type: 'NAVIGATE', payload: 11 });
  });
});