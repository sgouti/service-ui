import { combineReducers } from 'redux';
import { fetchReducer } from 'controllers/fetch';
import { loadingReducer } from 'controllers/loading';
import { CLUSTERS_NAMESPACE, NAMESPACE } from './constants';

export const analyzerInsightsReducer = combineReducers({
  summary: fetchReducer(NAMESPACE, { initialState: null }),
  clusters: fetchReducer(CLUSTERS_NAMESPACE, { initialState: [], contentPath: 'content' }),
  loading: loadingReducer(NAMESPACE),
  clustersLoading: loadingReducer(CLUSTERS_NAMESPACE),
});