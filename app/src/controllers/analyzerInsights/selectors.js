const domainSelector = (state) => state.analyzerInsights || {};

export const analyzerInsightsSelector = (state) => domainSelector(state).summary;
export const analyzerInsightsLoadingSelector = (state) => domainSelector(state).loading;
export const analyzerInsightsClustersSelector = (state) => domainSelector(state).clusters || [];
export const analyzerInsightsClustersLoadingSelector = (state) =>
  domainSelector(state).clustersLoading;