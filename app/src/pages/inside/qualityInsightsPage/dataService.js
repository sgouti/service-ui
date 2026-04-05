import { fetch } from 'common/utils/fetch';
import { URLS } from 'common/urls';

const REQUIRED_KEYS = [
  'metricCards',
  'summaryDashboard',
  'releases',
  'clusters',
  'failureCardPresets',
  'searchResults',
  'alertRules',
];

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const normalizeClusterMember = (member) => ({
  ...ensureObject(member),
  testName: member?.testName || 'Unknown test',
  launchName: member?.launchName || '',
  summary: member?.summary || 'Failure signature',
  location: member?.location || '-',
  similarity: member?.similarity || '0.00',
  defectType: member?.defectType || 'To investigate',
  defectTone: member?.defectTone || 'neutral',
  lifecycleState: member?.lifecycleState || 'active',
  followUpOutcome: member?.followUpOutcome || 'No later outcome',
});

const normalizeCluster = (cluster) => ({
  ...ensureObject(cluster),
  name: cluster?.name || 'Cluster',
  title: cluster?.title || cluster?.summary || 'Failure signature',
  summary: cluster?.summary || cluster?.title || 'Failure signature',
  signature: cluster?.signature || cluster?.summary || cluster?.title || 'Failure signature',
  subtitle: cluster?.subtitle || '',
  tone: cluster?.tone || 'neutral',
  status: cluster?.status || 'unknown',
  memberSource: cluster?.memberSource || 'summary-only',
  members: ensureArray(cluster?.members).map(normalizeClusterMember),
  rows: ensureArray(cluster?.rows),
  emptyMessage: cluster?.emptyMessage || '',
});

const normalizeUnclusteredFailure = (failure) => ({
  ...ensureObject(failure),
  testName: failure?.testName || 'Unknown test',
  launchName: failure?.launchName || '',
  summary: failure?.summary || 'Unclassified failure',
  location: failure?.location || '-',
  defectType: failure?.defectType || 'To investigate',
  defectTone: failure?.defectTone || 'neutral',
  triageState: failure?.triageState || 'To investigate',
  lifecycleState: failure?.lifecycleState || 'active',
  followUpOutcome: failure?.followUpOutcome || 'No later outcome',
});

const normalizeFailureCardPreset = (preset) => ({
  ...ensureObject(preset),
  title: preset?.title || 'Unknown failure',
  category: preset?.category || 'To investigate',
  launch: preset?.launch || '',
  summary: preset?.summary || 'Failure summary unavailable',
  location: preset?.location || '-',
  duration: preset?.duration || '0s',
  expected: preset?.expected || '',
  actual: preset?.actual || '',
  rawLog: ensureArray(preset?.rawLog),
  tone: preset?.tone || 'neutral',
});

const extractErrorMessage = (error, insightsUrl) => {
  if (!error) {
    return `Quality Insights request failed: ${insightsUrl}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  if (error.error_description) {
    return error.error_description;
  }

  if (error.messageId) {
    return `${error.messageId}${error.localizedMessage ? `: ${error.localizedMessage}` : ''}`;
  }

  if (error.localizedMessage) {
    return error.localizedMessage;
  }

  if (error.response?.status) {
    return `Quality Insights request failed with status ${error.response.status}.`;
  }

  return `Quality Insights request failed: ${insightsUrl}`;
};

const normalizeInsightsData = (payload) => ({
  ...ensureObject(payload),
  metricCards: ensureObject(payload?.metricCards),
  summaryDashboard: ensureObject(payload?.summaryDashboard),
  summaryBreakdownRows: ensureArray(payload?.summaryBreakdownRows),
  sprintRows: ensureArray(payload?.sprintRows),
  alertHighlights: ensureArray(payload?.alertHighlights),
  releases: ensureArray(payload?.releases),
  clusters: ensureArray(payload?.clusters).map(normalizeCluster),
  novelFailures: ensureArray(payload?.novelFailures),
  unclusteredFailures: ensureArray(payload?.unclusteredFailures).map(normalizeUnclusteredFailure),
  similarFailures: ensureArray(payload?.similarFailures),
  analysisPipeline: ensureArray(payload?.analysisPipeline),
  defectBreakdown: ensureArray(payload?.defectBreakdown),
  analysisRows: ensureArray(payload?.analysisRows),
  flakyTests: ensureArray(payload?.flakyTests),
  durationRows: ensureArray(payload?.durationRows),
  searchResults: ensureArray(payload?.searchResults),
  searchHowItWorks: ensureArray(payload?.searchHowItWorks),
  alertRules: ensureArray(payload?.alertRules),
  alertHistory: ensureArray(payload?.alertHistory),
  shareLinks: ensureArray(payload?.shareLinks),
  summaryTrend: ensureArray(payload?.summaryTrend),
  flakinessTrend: ensureArray(payload?.flakinessTrend),
  passRateTrend: ensureArray(payload?.passRateTrend),
  failureCountTrend: ensureArray(payload?.failureCountTrend),
  shareViewsTrend: ensureArray(payload?.shareViewsTrend),
  searchBreakdown: ensureArray(payload?.searchBreakdown),
  failureCardPresets: ensureArray(payload?.failureCardPresets).map(normalizeFailureCardPreset),
  testLaunchMap: ensureObject(payload?.testLaunchMap),
  launchIdMap: ensureObject(payload?.launchIdMap),
  defaultSearchTerm: payload?.defaultSearchTerm || '',
  shareDashboards: ensureArray(payload?.shareDashboards),
});

export const fetchLaunchData = async (projectId) => {
  const insightsUrl = URLS.projectQualityInsights(projectId);
  let response;

  try {
    response = await fetch(insightsUrl);
  } catch (error) {
    throw new Error(extractErrorMessage(error, insightsUrl));
  }

  const missingKey = REQUIRED_KEYS.find((key) => response?.[key] === undefined);

  if (!response || missingKey) {
    throw new Error(`Quality Insights backend payload is incomplete. Missing key: ${missingKey || 'unknown'}.`);
  }

  return response;
};

export const transformLaunchesToInsightsData = (payload) => normalizeInsightsData(payload);