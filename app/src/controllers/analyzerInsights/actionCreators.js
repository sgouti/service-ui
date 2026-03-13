import { FETCH_ANALYZER_CLUSTERS, FETCH_ANALYZER_INSIGHTS } from './constants';

export const fetchAnalyzerInsightsAction = (payload = {}) => ({
  type: FETCH_ANALYZER_INSIGHTS,
  payload,
});

export const fetchAnalyzerClustersAction = (payload) => ({
  type: FETCH_ANALYZER_CLUSTERS,
  payload,
});