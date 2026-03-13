import {
  analyzerInsightsClustersLoadingSelector,
  analyzerInsightsClustersSelector,
  analyzerInsightsLoadingSelector,
  analyzerInsightsSelector,
} from './selectors';

describe('analyzerInsights selectors', () => {
  test('should read analyzer insights state', () => {
    const state = {
      analyzerInsights: {
        summary: { launchId: 10 },
        clusters: [{ id: 1 }],
        loading: true,
        clustersLoading: false,
      },
    };

    expect(analyzerInsightsSelector(state)).toEqual({ launchId: 10 });
    expect(analyzerInsightsClustersSelector(state)).toEqual([{ id: 1 }]);
    expect(analyzerInsightsLoadingSelector(state)).toBe(true);
    expect(analyzerInsightsClustersLoadingSelector(state)).toBe(false);
  });

  test('should tolerate missing controller state', () => {
    expect(analyzerInsightsSelector({})).toBeUndefined();
    expect(analyzerInsightsClustersSelector({})).toEqual([]);
    expect(analyzerInsightsLoadingSelector({})).toBeUndefined();
    expect(analyzerInsightsClustersLoadingSelector({})).toBeUndefined();
  });
});