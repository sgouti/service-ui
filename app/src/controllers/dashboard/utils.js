import {
  NOTIFICATION_TYPES,
  showDefaultErrorNotification,
  showNotification,
} from 'controllers/notification';
import { formatSortingString, parseSortingString } from 'controllers/sorting/utils';
import { ERROR_CODES } from './constants';
import { DEFAULT_SORTING } from './constants';

const SUPPORTED_DASHBOARD_SORT_FIELDS = new Set([
  'creationDate',
  'description',
  'name',
  'owner',
]);

export function tryParseConfig(config) {
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

export function getDashboardNotificationAction(error, name) {
  const dashboardExists = error.errorCode === ERROR_CODES.DASHBOARD_EXISTS;

  return dashboardExists
    ? showNotification({
        messageId: 'dashboardExists',
        type: NOTIFICATION_TYPES.ERROR,
        values: { name },
      })
    : showDefaultErrorNotification(error);
}

export function sanitizeDashboardSorting(sortingString) {
  const { fields, direction } = parseSortingString(sortingString);

  if (!fields.length) {
    return DEFAULT_SORTING;
  }

  const hasUnsupportedField = fields.some(
    (field) => !SUPPORTED_DASHBOARD_SORT_FIELDS.has(field),
  );

  if (hasUnsupportedField) {
    return DEFAULT_SORTING;
  }

  return formatSortingString(fields, direction || undefined);
}
