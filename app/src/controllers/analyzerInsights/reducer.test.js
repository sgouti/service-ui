import { FETCH_ERROR, FETCH_START, FETCH_SUCCESS } from 'controllers/fetch';
import { analyzerInsightsReducer } from './reducer';
import { CLUSTERS_NAMESPACE, NAMESPACE } from './constants';

describe('analyzerInsights reducer', () => {
  test('should return default state', () => {
    expect(analyzerInsightsReducer(undefined, {})).toEqual({
      summary: null,
      clusters: [],
      loading: false,
      clustersLoading: false,
    });
  });

  test('should store summary payload for analyzer insights namespace', () => {
    const state = analyzerInsightsReducer(undefined, {
      type: FETCH_SUCCESS,
      payload: { launchId: 15, coverage: { coveragePercent: 83 } },
      meta: { namespace: NAMESPACE },
    });

    expect(state.summary).toEqual({ launchId: 15, coverage: { coveragePercent: 83 } });
    expect(state.loading).toBe(false);
  });

  test('should store cluster content and keep summary intact', () => {
    const previousState = {
      summary: { launchId: 15 },
      clusters: [],
      loading: false,
      clustersLoading: true,
    };

    const state = analyzerInsightsReducer(previousState, {
      type: FETCH_SUCCESS,
      payload: { content: [{ id: 7, matchedTests: 3 }] },
      meta: { namespace: CLUSTERS_NAMESPACE },
    });

    expect(state.summary).toEqual({ launchId: 15 });
    expect(state.clusters).toEqual([{ id: 7, matchedTests: 3 }]);
    expect(state.clustersLoading).toBe(false);
  });

  test('should handle loading lifecycle independently for summary and clusters', () => {
    const stateAfterSummaryStart = analyzerInsightsReducer(undefined, {
      type: FETCH_START,
      meta: { namespace: NAMESPACE },
    });
    const stateAfterClusterStart = analyzerInsightsReducer(stateAfterSummaryStart, {
      type: FETCH_START,
      meta: { namespace: CLUSTERS_NAMESPACE },
    });
    const finalState = analyzerInsightsReducer(stateAfterClusterStart, {
      type: FETCH_ERROR,
      meta: { namespace: CLUSTERS_NAMESPACE },
    });

    expect(stateAfterSummaryStart.loading).toBe(true);
    expect(stateAfterSummaryStart.clustersLoading).toBe(false);
    expect(stateAfterClusterStart.clustersLoading).toBe(true);
    expect(finalState.loading).toBe(true);
    expect(finalState.clustersLoading).toBe(false);
  });
});