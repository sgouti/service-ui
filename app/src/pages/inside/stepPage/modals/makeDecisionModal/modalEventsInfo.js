const createEmptyTrackingEvent = () => ({});

export const DEFAULT_EDIT_DEFECTS_EVENTS = {
  getClickIgnoreAACheckboxEvent: createEmptyTrackingEvent,
  getClickCommentEditorIcon: createEmptyTrackingEvent,
  getClickItemLinkEvent: createEmptyTrackingEvent,
  getOpenStackTraceEvent: createEmptyTrackingEvent,
  getExpandFooterEvent: createEmptyTrackingEvent,
  getClickOnApplyDefectForOptionEvent: createEmptyTrackingEvent,
  getOnChangeCommentOptionEvent: createEmptyTrackingEvent,
  getToggleShowErrLogsSwitcherEvent: createEmptyTrackingEvent,
  getClickOnApplyBulkEvent: createEmptyTrackingEvent,
  getClickOnApplyEvent: createEmptyTrackingEvent,
  onClickExternalLinkEvent: createEmptyTrackingEvent,
};

export const normalizeModalEventsInfo = (eventsInfo = {}) => ({
  editDefectsEvents: {
    ...DEFAULT_EDIT_DEFECTS_EVENTS,
    ...(eventsInfo.editDefectsEvents || {}),
  },
  linkIssueEvents: eventsInfo.linkIssueEvents || {},
  unlinkIssueEvents: eventsInfo.unlinkIssueEvents || {},
  postIssueEvents: eventsInfo.postIssueEvents || {},
});