import React from 'react';
import { mount } from 'enzyme';
import { ConfidenceScoreIndicator } from './confidenceScoreIndicator';

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  useIntl: () => ({
    formatMessage: ({ defaultMessage }) => defaultMessage,
  }),
}));

describe('ConfidenceScoreIndicator', () => {
  test('applies warning and critical states for low confidence ranges', () => {
    const warningWrapper = mount(<ConfidenceScoreIndicator confidence={62} matchedLaunch="Sprint 44" />);
    const criticalWrapper = mount(<ConfidenceScoreIndicator confidence={41} />);

    expect(warningWrapper.find('.tone-warning')).toHaveLength(1);
    expect(warningWrapper.find('.warningDot')).toHaveLength(1);
    expect(criticalWrapper.find('.tone-critical')).toHaveLength(1);
    expect(criticalWrapper.find('.criticalNote').at(0).prop('children')).toBe('Review recommended');
  });
});
