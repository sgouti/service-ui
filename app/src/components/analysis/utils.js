import { DEFECT_TYPES_LOCATORS_TO_DEFECT_TYPES } from 'common/constants/defectTypes';

export const normalizeMatchSource = (matchSource = '', methodName = '', modelInfo = '') => {
  const normalizedSource = String(matchSource).toLowerCase();
  if (['semantic', 'keyword', 'hybrid'].includes(normalizedSource)) {
    return normalizedSource;
  }

  const method = `${methodName || ''} ${modelInfo || ''}`.toLowerCase();
  if (method.includes('hybrid')) {
    return 'hybrid';
  }
  if (
    method.includes('semantic') ||
    method.includes('embed') ||
    method.includes('rerank') ||
    method.includes('bge')
  ) {
    return 'semantic';
  }
  return 'keyword';
};

export const getConfidenceTone = (confidence) => {
  const score = Number(confidence) || 0;
  if (score >= 90) {
    return 'high';
  }
  if (score >= 70) {
    return 'default';
  }
  if (score >= 50) {
    return 'warning';
  }
  return 'critical';
};

const toTitleCase = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getDefectTypeLabel = (issueType) => {
  if (!issueType) {
    return 'Suggested Defect';
  }

  const locator = String(issueType).toLowerCase();
  const defectKey =
    DEFECT_TYPES_LOCATORS_TO_DEFECT_TYPES[locator] ||
    DEFECT_TYPES_LOCATORS_TO_DEFECT_TYPES[`${locator.slice(0, 2)}001`];

  return defectKey ? toTitleCase(defectKey.replace(/_/g, ' ')) : locator.toUpperCase();
};

export const getMatchedLaunchLabel = (testItemResource = {}, suggestRs = {}) => {
  if (suggestRs.matchedLaunch) {
    return suggestRs.matchedLaunch;
  }
  if (testItemResource.launchName && testItemResource.launchNumber) {
    return `${testItemResource.launchName} #${testItemResource.launchNumber}`;
  }
  if (testItemResource.launchName) {
    return testItemResource.launchName;
  }
  if (testItemResource.launchId) {
    return `Launch #${testItemResource.launchId}`;
  }
  return null;
};
