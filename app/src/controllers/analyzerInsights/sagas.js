import { all, put, select, takeEvery } from 'redux-saga/effects';
import { fetchDataAction } from 'controllers/fetch';
import { projectKeySelector } from 'controllers/project';
import { URLS } from 'common/urls';
import {
  CLUSTERS_NAMESPACE,
  FETCH_ANALYZER_CLUSTERS,
  FETCH_ANALYZER_INSIGHTS,
  NAMESPACE,
} from './constants';

function* fetchAnalyzerInsights({ payload = {} }) {
  const projectKey = yield select(projectKeySelector);
  yield put(fetchDataAction(NAMESPACE)(URLS.analyzerInsights(projectKey, payload)));
}

function* fetchAnalyzerClusters({ payload = {} }) {
  const { launchId } = payload;
  if (!launchId) {
    return;
  }
  const projectKey = yield select(projectKeySelector);
  yield put(
    fetchDataAction(CLUSTERS_NAMESPACE)(
      URLS.clusterByLaunchId(projectKey, launchId, {
        'page.page': 1,
        'page.size': 5,
        'page.sort': 'matchedTests,DESC',
      }),
    ),
  );
}

function* watchFetchAnalyzerInsights() {
  yield takeEvery(FETCH_ANALYZER_INSIGHTS, fetchAnalyzerInsights);
}

function* watchFetchAnalyzerClusters() {
  yield takeEvery(FETCH_ANALYZER_CLUSTERS, fetchAnalyzerClusters);
}

export function* analyzerInsightsSagas() {
  yield all([watchFetchAnalyzerInsights(), watchFetchAnalyzerClusters()]);
}