import { normalizeModalEventsInfo } from './modalEventsInfo';

describe('makeDecisionModal helpers', () => {
  test('provides callable default analytics handlers for cluster-triggered flows', () => {
    const eventsInfo = normalizeModalEventsInfo({});

    expect(eventsInfo.editDefectsEvents.getClickItemLinkEvent(false, 'cluster')).toEqual({});
    expect(eventsInfo.editDefectsEvents.getOpenStackTraceEvent(false, 'cluster')).toEqual({});
    expect(eventsInfo.editDefectsEvents.getClickOnApplyEvent()).toEqual({});
    expect(eventsInfo.editDefectsEvents.getClickOnApplyBulkEvent()).toEqual({});
  });

  test('keeps provided analytics handlers intact', () => {
    const handler = jest.fn(() => ({ type: 'custom-event' }));
    const eventsInfo = normalizeModalEventsInfo({
      editDefectsEvents: {
        getClickItemLinkEvent: handler,
      },
    });

    expect(eventsInfo.editDefectsEvents.getClickItemLinkEvent(true, 'history')).toEqual({
      type: 'custom-event',
    });
    expect(handler).toHaveBeenCalledWith(true, 'history');
  });
});