import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { useDispatch } from 'react-redux';
import { hideModalAction, showModalAction } from 'controllers/modal';
import { ModalLayout } from 'components/main/modal';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, ProgressBar } from './ui';

const cx = classNames.bind(styles);

const RELEASE_ATTRIBUTE_KEYS = ['release'];
const SPRINT_ATTRIBUTE_KEYS = ['sprint'];
const UNRELEASED_TITLE = 'Unreleased';
const UNASSIGNED_SPRINT_TITLE = 'No sprint assigned';
const RELEASE_FILTER_ALL = '__all__';
const RELEASE_DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];
const RESERVED_RELEASE_ATTRIBUTE_KEYS = new Set(['build', 'env', 'environment', 'release', 'sprint']);
const RELEASE_ASSIGNMENTS_STORAGE_KEY = 'quality-insights-release-assignments';
const RELEASE_REMOVALS_STORAGE_KEY = 'quality-insights-release-removals';

const parseRate = (value) => Number(String(value || '').replace('%', '')) || 0;
const getLaunchAttributes = (launch) => (Array.isArray(launch?.attributes) ? launch.attributes : []);
const getExecutionTotal = (launch) => Number(launch?.statistics?.executions?.total || 0);
const getExecutionPassed = (launch) => Number(launch?.statistics?.executions?.passed || 0);
const getExecutionFailed = (launch) => Number(launch?.statistics?.executions?.failed || 0);
const getLaunchStartTimestamp = (launch) => {
  const timestamp = launch?.startTime ? new Date(launch.startTime).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const getLaunchId = (launch) => launch?.id || launch?.launchId || null;
const getLaunchLabel = (launch) => {
  if (!launch) {
    return 'Launch';
  }

  const launchName = String(launch.name || 'Launch').trim() || 'Launch';
  return launch.number === undefined || launch.number === null ? launchName : `${launchName} #${launch.number}`;
};
const getLaunchStatusLabel = (status) => {
  const normalizedStatus = String(status || '').toUpperCase();
  if (normalizedStatus === 'PASSED') {
    return 'Passed';
  }
  if (normalizedStatus === 'FAILED') {
    return 'Failed';
  }
  if (normalizedStatus === 'SKIPPED') {
    return 'Skipped';
  }
  return normalizedStatus ? `${normalizedStatus.charAt(0)}${normalizedStatus.slice(1).toLowerCase()}` : 'Unknown';
};

const getLaunchAttributeValue = (launch, keys) => {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const attribute = getLaunchAttributes(launch).find((item) => {
    const attributeKey = String(item?.key || '').trim().toLowerCase();
    const attributeValue = String(item?.value || '').trim();
    return keySet.has(attributeKey) && attributeValue;
  });

  return String(attribute?.value || '').trim();
};

const getReleaseAttribute = (launch) => getLaunchAttributeValue(launch, RELEASE_ATTRIBUTE_KEYS);
const getSprintAttribute = (launch) => getLaunchAttributeValue(launch, SPRINT_ATTRIBUTE_KEYS);

const getLaunchName = (launch) => String(launch?.name || '').trim();

const getLaunchTags = (launch) =>
  Array.from(
    new Set(
      getLaunchAttributes(launch)
        .filter((attribute) => {
          const key = String(attribute?.key || '').trim().toLowerCase();
          const value = String(attribute?.value || '').trim();
          return value && !RESERVED_RELEASE_ATTRIBUTE_KEYS.has(key);
        })
        .map((attribute) => String(attribute.value).trim()),
    ),
  );

const getDateInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (value, amount) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + amount);
  return date;
};

const getLaunchWindow = (launch) => {
  const timestamp = getLaunchStartTimestamp(launch);
  if (!timestamp) {
    return { start: null, end: null };
  }

  const date = new Date(timestamp);
  return {
    start: date,
    end: date,
  };
};

const isRangeOverlap = (leftStart, leftEnd, rightStart, rightEnd) => {
  if (!leftStart || !leftEnd || !rightStart || !rightEnd) {
    return false;
  }

  return leftStart <= rightEnd && rightStart <= leftEnd;
};

const getLatestWindowEnd = (items = []) =>
  items.reduce((latest, item) => {
    const candidate = item?.windowEnd ? new Date(item.windowEnd) : null;
    if (!candidate || Number.isNaN(candidate.getTime())) {
      return latest;
    }

    return !latest || candidate > latest ? candidate : latest;
  }, null);

const getNextAvailableWindow = (items = []) => {
  const latestWindowEnd = getLatestWindowEnd(items);
  const start = addDays(latestWindowEnd || new Date(), 1) || new Date();
  const end = addDays(start, 6) || start;

  return {
    start: getDateInputValue(start),
    end: getDateInputValue(end),
  };
};

const loadReleaseAssignments = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(RELEASE_ASSIGNMENTS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

const saveReleaseAssignments = (assignments) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RELEASE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    // ignore storage failures and keep the page usable
  }
};

const hydrateReleaseAssignment = (assignment) => ({
  sprintName: assignment.sprintName,
  releaseName: assignment.releaseName,
  createdAt: assignment.createdAt,
});

const loadReleaseRemovals = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(RELEASE_REMOVALS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? parsedValue : {};
  } catch (error) {
    return {};
  }
};

const saveReleaseRemovals = (removals) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RELEASE_REMOVALS_STORAGE_KEY, JSON.stringify(removals));
  } catch (error) {
    // ignore storage failures and keep the page usable
  }
};

const buildSprintAssignmentKey = (sprintName) => String(sprintName || '').trim().toLowerCase();

const buildReleaseWindowIndex = (draftReleases = []) =>
  draftReleases.reduce((index, draftRelease) => {
    if (!draftRelease?.name || !draftRelease?.windowStart || !draftRelease?.windowEnd) {
      return index;
    }

    index.set(String(draftRelease.name).trim(), {
      start: draftRelease.windowStart,
      end: draftRelease.windowEnd,
    });
    return index;
  }, new Map());

const buildScopedLaunchWindow = (launches, filters) => {
  const orderedLaunches = sortLaunchesByStartTime(launches);
  const days = Number(filters.dateRange);
  const anchorTimestamp = orderedLaunches[0] ? getLaunchStartTimestamp(orderedLaunches[0]) : Date.now();
  const cutoffTimestamp = Number.isNaN(days) || filters.dateRange === 'all'
    ? null
    : anchorTimestamp - days * 24 * 60 * 60 * 1000;

  return orderedLaunches.filter((launch) => {
    const timestamp = getLaunchStartTimestamp(launch);
    const matchesDateRange = cutoffTimestamp === null || timestamp >= cutoffTimestamp;
    const launchName = getLaunchName(launch);
    const matchesLaunchName =
      filters.launchName === RELEASE_FILTER_ALL || launchName === filters.launchName;
    const launchTags = getLaunchTags(launch);
    const matchesTag = filters.tag === RELEASE_FILTER_ALL || launchTags.includes(filters.tag);

    return matchesDateRange && matchesLaunchName && matchesTag;
  });
};

const buildReleaseFilterOptions = (launches) => {
  const orderedLaunches = sortLaunchesByStartTime(launches);
  const launchNameOptions = Array.from(new Set(orderedLaunches.map((launch) => getLaunchName(launch)).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
  const tagOptions = Array.from(new Set(orderedLaunches.flatMap((launch) => getLaunchTags(launch))))
    .sort((left, right) => left.localeCompare(right));

  return {
    dateRange: RELEASE_DATE_RANGE_OPTIONS,
    launchName: [
      { value: RELEASE_FILTER_ALL, label: 'All launch names' },
      ...launchNameOptions.map((launchName) => ({ value: launchName, label: launchName })),
    ],
    tag: [
      { value: RELEASE_FILTER_ALL, label: 'All tags' },
      ...tagOptions.map((tag) => ({ value: tag, label: tag })),
    ],
  };
};

const buildReleaseNameFromWindow = (prefix, startValue, endValue) => {
  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return prefix;
  }

  const startLabel = formatShortDate(startDate);
  const endLabel = endDate && !Number.isNaN(endDate.getTime()) ? formatShortDate(endDate) : '';
  return endLabel && endLabel !== startLabel ? `${prefix} ${startLabel} - ${endLabel}` : `${prefix} ${startLabel}`;
};

const buildSuggestedSprintName = (releaseName, windowStartValue, windowEndValue) => {
  const startDate = windowStartValue ? new Date(windowStartValue) : null;
  const endDate = windowEndValue ? new Date(windowEndValue) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return `Sprint for ${releaseName}`;
  }

  const startLabel = formatShortDate(startDate);
  const endLabel = endDate && !Number.isNaN(endDate.getTime()) ? formatShortDate(endDate) : '';
  return endLabel && endLabel !== startLabel ? `Sprint ${startLabel} - ${endLabel}` : `Sprint ${startLabel}`;
};

const startOfWeek = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const result = new Date(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (value) => {
  const start = startOfWeek(value);
  if (!start) {
    return null;
  }

  const result = new Date(start);
  result.setDate(result.getDate() + 6);
  return result;
};

const getAutoSprintLabel = (launch) => {
  const timestamp = getLaunchStartTimestamp(launch);
  if (!timestamp) {
    return UNASSIGNED_SPRINT_TITLE;
  }

  return buildSuggestedSprintName('Sprint', getDateInputValue(startOfWeek(timestamp)), getDateInputValue(endOfWeek(timestamp)));
};

const sortLaunchesByStartTime = (launches) =>
  [...(launches || [])].sort((left, right) => getLaunchStartTimestamp(right) - getLaunchStartTimestamp(left));

const formatDelta = (currentValue, previousValue, suffix = '') => {
  if (previousValue === null || previousValue === undefined) {
    return { text: 'No prior release', tone: 'neutral' };
  }

  const delta = Number(currentValue || 0) - Number(previousValue || 0);
  if (delta === 0) {
    return { text: `No change${suffix ? ` ${suffix}` : ''}`, tone: 'neutral' };
  }

  return {
    text: `${delta > 0 ? '+' : ''}${delta.toFixed(suffix === 'pts' ? 1 : 0)}${suffix ? ` ${suffix}` : ''}`,
    tone: delta > 0 ? 'success' : 'danger',
  };
};

const formatShortDate = (value) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatStartedAt = (value) => {
  if (!value) {
    return 'Unknown start';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown start';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDateRange = (launches) => {
  const timestamps = (launches || [])
    .map((launch) => launch?.startTime)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (!timestamps.length) {
    return 'No execution window';
  }

  const startLabel = formatShortDate(timestamps[0]);
  const endLabel = formatShortDate(timestamps[timestamps.length - 1]);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
};

const getLaunchRangeBounds = (launches) => {
  const orderedDates = (launches || [])
    .map((launch) => launch?.startTime)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  return {
    start: orderedDates.length ? getDateInputValue(orderedDates[0]) : '',
    end: orderedDates.length ? getDateInputValue(orderedDates[orderedDates.length - 1]) : '',
  };
};

const getHealthState = (rate) => {
  if (rate >= 85) {
    return { label: 'Healthy', tone: 'success' };
  }
  if (rate >= 65) {
    return { label: 'Watchlist', tone: 'warning' };
  }
  return { label: 'Needs attention', tone: 'danger' };
};

const buildLaunchStats = (launch) => {
  const total = Math.max(getExecutionTotal(launch), getExecutionPassed(launch) + getExecutionFailed(launch));
  const passed = getExecutionPassed(launch);
  const failed = getExecutionFailed(launch);
  const blocked = Math.max(total - passed - failed, 0);
  const passRate = total ? Math.round((passed / total) * 100) : 0;
  const status = getLaunchStatusLabel(launch?.status);
  const healthState = getHealthState(passRate);

  return {
    launch: getLaunchLabel(launch),
    launchId: getLaunchId(launch),
    description: launch?.description,
    status,
    passed,
    failed,
    blocked,
    total,
    owner: launch?.owner,
    started: formatStartedAt(launch?.startTime),
    tone: healthState.tone,
    rate: passRate,
  };
};

const buildReleaseOption = (release) => ({
  value: release.title,
  label: release.title,
  window: release.window,
  windowStart: release.windowStart,
  windowEnd: release.windowEnd,
  notes: release.notes,
  draft: release.isDraft,
  sprints: release.sprints,
});

const buildSprintStats = (sprint) => {
  const launchRates = (sprint?.launches || []).map(buildLaunchStats);
  const totals = launchRates.reduce(
    (accumulator, launch) => ({
      passed: accumulator.passed + launch.passed,
      failed: accumulator.failed + launch.failed,
      blocked: accumulator.blocked + launch.blocked,
      total: accumulator.total + launch.total,
    }),
    { passed: 0, failed: 0, blocked: 0, total: 0 },
  );
  const passRate = totals.total ? Math.round((totals.passed / totals.total) * 100) : 0;

  return {
    launchCount: launchRates.length,
    passedTotal: totals.passed,
    failedTotal: totals.failed,
    blockedTotal: totals.blocked,
    totalTests: totals.total,
    testCasesRun: totals.total,
    passRate,
    attentionCount: launchRates.filter((item) => item.tone === 'danger' || item.tone === 'warning').length,
    launchRates,
  };
};

const buildReleasesFromLaunches = (launches, projectId, releaseAssignments = [], releaseWindowIndex = new Map(), releaseRemovals = {}) => {
  const grouped = new Map();
  const assignmentIndex = new Map(
    releaseAssignments
      .filter((assignment) => assignment?.sprintName && assignment?.releaseName)
      .map((assignment) => [buildSprintAssignmentKey(assignment.sprintName), String(assignment.releaseName).trim()]),
  );
  const removalIndex = new Set(Object.keys(releaseRemovals || {}).map((sprintName) => buildSprintAssignmentKey(sprintName)));

  sortLaunchesByStartTime(launches).forEach((launch) => {
    const releaseAttribute = getReleaseAttribute(launch);
    const sprintAttribute = getSprintAttribute(launch);
    const sprintKey = sprintAttribute || getAutoSprintLabel(launch);
    const assignedRelease = assignmentIndex.get(buildSprintAssignmentKey(sprintKey));
    const sprintIsRemoved = removalIndex.has(buildSprintAssignmentKey(sprintKey));
    const releaseKey = sprintIsRemoved ? UNRELEASED_TITLE : (releaseAttribute || assignedRelease || UNRELEASED_TITLE);
    const manualReleaseWindow = releaseWindowIndex.get(releaseKey);
    const launchRange = getLaunchWindow(launch);
    const releaseWindowMatches = !manualReleaseWindow || isRangeOverlap(
      launchRange.start,
      launchRange.end,
      new Date(manualReleaseWindow.start),
      new Date(manualReleaseWindow.end),
    );
    const resolvedReleaseKey = releaseWindowMatches ? releaseKey : UNRELEASED_TITLE;

    if (!grouped.has(resolvedReleaseKey)) {
      grouped.set(resolvedReleaseKey, {
        title: resolvedReleaseKey,
        isUnreleased: resolvedReleaseKey === UNRELEASED_TITLE,
        autoDetected: !releaseAttribute && !assignedRelease,
        assignedRelease: !!assignedRelease && resolvedReleaseKey !== UNRELEASED_TITLE && !sprintIsRemoved,
        sprints: new Map(),
        windowStart: null,
        windowEnd: null,
      });
    }

    const releaseGroup = grouped.get(resolvedReleaseKey);

    if (!releaseGroup.sprints.has(sprintKey)) {
      releaseGroup.sprints.set(sprintKey, {
        name: sprintKey,
        isUnassigned: !sprintAttribute,
        autoDetected: !sprintAttribute,
        removedFromRelease: sprintIsRemoved,
        assignedRelease: resolvedReleaseKey !== UNRELEASED_TITLE,
        launches: [],
      });
    }

    releaseGroup.sprints.get(sprintKey).launches.push(launch);
    const launchWindow = getLaunchWindow(launch);
    if (launchWindow.start && (!releaseGroup.windowStart || launchWindow.start < releaseGroup.windowStart)) {
      releaseGroup.windowStart = launchWindow.start;
    }
    if (launchWindow.end && (!releaseGroup.windowEnd || launchWindow.end > releaseGroup.windowEnd)) {
      releaseGroup.windowEnd = launchWindow.end;
    }
  });

  return Array.from(grouped.values())
    .map((releaseGroup) => {
      const sprintEntries = Array.from(releaseGroup.sprints.values())
        .map((sprintGroup) => {
          const sprintStats = buildSprintStats(sprintGroup);
          const healthState = getHealthState(sprintStats.passRate);
          const latestTimestamp = Math.max(...sprintGroup.launches.map(getLaunchStartTimestamp), 0);

          const sprintWindowStart = sprintGroup.launches.reduce((earliest, launch) => {
            const launchWindow = getLaunchWindow(launch);
            return !launchWindow.start || (earliest && earliest <= launchWindow.start) ? earliest : launchWindow.start;
          }, null);
          const sprintWindowEnd = sprintGroup.launches.reduce((latest, launch) => {
            const launchWindow = getLaunchWindow(launch);
            return !launchWindow.end || (latest && latest >= launchWindow.end) ? latest : launchWindow.end;
          }, null);

          return {
            ...sprintGroup,
            latestTimestamp,
            dates: formatDateRange(sprintGroup.launches),
            windowStart: sprintWindowStart ? getDateInputValue(sprintWindowStart) : '',
            windowEnd: sprintWindowEnd ? getDateInputValue(sprintWindowEnd) : '',
            meta: `${sprintStats.launchCount} launches, ${sprintStats.totalTests} test cases`,
            rate: `${sprintStats.passRate}%`,
            state: healthState.label,
            tone: healthState.tone,
            launchCount: sprintStats.launchCount,
            totalTests: sprintStats.totalTests,
            passedTotal: sprintStats.passedTotal,
            failedTotal: sprintStats.failedTotal,
            blockedTotal: sprintStats.blockedTotal,
            launchRates: sprintStats.launchRates,
          };
        })
        .sort((left, right) => {
          if (left.isUnassigned !== right.isUnassigned) {
            return left.isUnassigned ? 1 : -1;
          }
          return right.latestTimestamp - left.latestTimestamp;
        });

      const releaseLaunches = sprintEntries.flatMap((sprint) => sprint.launches);
      const totalTests = releaseLaunches.reduce((sum, launch) => sum + Math.max(getExecutionTotal(launch), getExecutionPassed(launch) + getExecutionFailed(launch)), 0);
      const passedTests = releaseLaunches.reduce((sum, launch) => sum + getExecutionPassed(launch), 0);
      const releaseRate = totalTests ? Math.round((passedTests / totalTests) * 100) : 0;
      const healthState = getHealthState(releaseRate);
      const latestTimestamp = Math.max(...releaseLaunches.map(getLaunchStartTimestamp), 0);

      return {
        title: releaseGroup.title,
        isUnreleased: releaseGroup.isUnreleased,
        autoDetected: releaseGroup.autoDetected,
        assignedRelease: releaseGroup.assignedRelease,
        latestTimestamp,
        meta: releaseGroup.isUnreleased
          ? `${releaseLaunches.length} launches without a release attribute`
          : `${releaseLaunches.length} launches in ${projectId}`,
        rate: `${releaseRate}%`,
        passRate: releaseRate,
        state: healthState.label,
        stateTone: healthState.tone,
        sprints: sprintEntries,
        launchCount: releaseLaunches.length,
        sprintCount: sprintEntries.length,
        totalTests,
        window: formatDateRange(releaseLaunches),
        windowStart: releaseGroup.windowStart ? getDateInputValue(releaseGroup.windowStart) : '',
        windowEnd: releaseGroup.windowEnd ? getDateInputValue(releaseGroup.windowEnd) : '',
        notes: releaseGroup.isUnreleased
          ? 'Auto-detected sprint buckets are derived from launch dates until a release attribute is assigned.'
          : 'Grouped from launch attributes and auto-detected sprint windows.',
      };
    })
    .sort((left, right) => {
      if (left.isUnreleased !== right.isUnreleased) {
        return left.isUnreleased ? 1 : -1;
      }
      return right.latestTimestamp - left.latestTimestamp;
    });
};

const buildReleaseStats = (releases) => {
  const activeReleases = releases.filter((release) => !release.isDraft);
  const visibleReleases = activeReleases.length ? activeReleases : releases;
  const sprintCount = visibleReleases.reduce((total, release) => total + release.sprints.length, 0);
  const launchCount = visibleReleases.reduce((total, release) => total + release.launchCount, 0);
  const attentionCount = releases.reduce(
    (total, release) => total + release.sprints.filter((sprint) => sprint.tone === 'danger' || sprint.tone === 'warning').length,
    0,
  );
  const latestRelease = visibleReleases[0] || null;
  const previousRelease = visibleReleases[1] || null;

  return {
    sprintCount,
    launchCount,
    attentionCount,
    latestRelease,
    releaseDelta: formatDelta(latestRelease?.passRate || 0, previousRelease?.passRate, 'pts'),
    sprintDelta: formatDelta(latestRelease?.sprintCount || 0, previousRelease?.sprintCount, 'sprints'),
    launchDelta: formatDelta(latestRelease?.launchCount || 0, previousRelease?.launchCount, 'launches'),
    attentionDelta: formatDelta(
      (latestRelease?.sprints || []).filter((sprint) => sprint.tone === 'danger' || sprint.tone === 'warning').length,
      previousRelease ? previousRelease.sprints.filter((sprint) => sprint.tone === 'danger' || sprint.tone === 'warning').length : undefined,
      'at-risk sprints',
    ),
  };
};

const RELEASE_DRAFTS_STORAGE_KEY = 'quality-insights-release-drafts';

const loadReleaseDrafts = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(RELEASE_DRAFTS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

const saveReleaseDrafts = (drafts) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RELEASE_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    // ignore storage failures and keep the page usable
  }
};

const hydrateDraftRelease = (draft) => ({
  name: draft.name,
  windowStart: draft.windowStart,
  windowEnd: draft.windowEnd,
  notes: draft.notes,
  createdAt: draft.createdAt,
});

const mergeReleaseCollections = (draftReleases, liveReleases) => {
  const mergedReleases = new Map();

  draftReleases.forEach((draftRelease) => {
    mergedReleases.set(draftRelease.title, draftRelease);
  });

  liveReleases.forEach((liveRelease) => {
    const existingRelease = mergedReleases.get(liveRelease.title);

    if (!existingRelease) {
      mergedReleases.set(liveRelease.title, liveRelease);
      return;
    }

    mergedReleases.set(liveRelease.title, {
      ...existingRelease,
      ...liveRelease,
      sprints: liveRelease.sprints.length ? liveRelease.sprints : existingRelease.sprints,
      launchCount: liveRelease.launchCount || existingRelease.launchCount,
      sprintCount: liveRelease.sprintCount || existingRelease.sprintCount,
      totalTests: liveRelease.totalTests || existingRelease.totalTests,
      passRate: liveRelease.passRate || existingRelease.passRate,
      rate: liveRelease.rate || existingRelease.rate,
      state: liveRelease.state || existingRelease.state,
      stateTone: liveRelease.stateTone || existingRelease.stateTone,
      autoDetected: liveRelease.autoDetected ?? existingRelease.autoDetected,
      assignedRelease: liveRelease.assignedRelease ?? existingRelease.assignedRelease,
      latestTimestamp: Math.max(existingRelease.latestTimestamp || 0, liveRelease.latestTimestamp || 0),
    });
  });

  return Array.from(mergedReleases.values()).sort((left, right) => {
    if (left.isUnreleased !== right.isUnreleased) {
      return left.isUnreleased ? 1 : -1;
    }

    return (right.latestTimestamp || 0) - (left.latestTimestamp || 0);
  });
};

const ReleaseGroupingModal = ({ type, hideModal, onSubmitDraft, releaseOptions }) => {
  const isRelease = type === 'release';
  const selectableReleases = releaseOptions.filter((option) => option.value !== UNRELEASED_TITLE);
  const defaultWindow = getNextAvailableWindow(selectableReleases);
  const nameTouchedRef = React.useRef(false);
  const [parentRelease, setParentRelease] = React.useState(selectableReleases[0]?.value || UNRELEASED_TITLE);
  const [windowStart, setWindowStart] = React.useState(defaultWindow.start);
  const [windowEnd, setWindowEnd] = React.useState(defaultWindow.end);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');

  const selectedReleaseDetails = releaseOptions.find((option) => option.value === parentRelease) || releaseOptions[0] || null;
  const releaseNameSuggestion = buildReleaseNameFromWindow('Release', windowStart, windowEnd);
  const sprintNameSuggestion = buildSuggestedSprintName(selectedReleaseDetails?.label || parentRelease, windowStart, windowEnd);
  const suggestedName = isRelease ? releaseNameSuggestion : sprintNameSuggestion;
  const [name, setName] = React.useState(suggestedName);

  React.useEffect(() => {
    if (!nameTouchedRef.current) {
      setName(suggestedName);
    }
  }, [suggestedName]);

  const releaseWindows = releaseOptions.filter((option) => option.windowStart && option.windowEnd);

  const submitDraft = (closeModal) => {
    const draftName = String(name || '').trim() || suggestedName;
    const draftStart = windowStart || defaultWindow.start;
    const draftEnd = windowEnd || defaultWindow.end;

    if (!draftStart || !draftEnd) {
      setError('Select a valid calendar range.');
      return;
    }

    const startDate = new Date(draftStart);
    const endDate = new Date(draftEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Select a valid calendar range.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be on or before the end date.');
      return;
    }

    const overlappingRelease = releaseWindows.find((release) =>
      isRangeOverlap(startDate, endDate, new Date(release.windowStart), new Date(release.windowEnd)),
    );

    if (isRelease && overlappingRelease) {
      setError(`Release range overlaps existing release ${overlappingRelease.label}. Choose a non-overlapping window that starts after ${overlappingRelease.windowEnd}.`);
      return;
    }

    if (!isRelease && selectedReleaseDetails?.windowStart && selectedReleaseDetails?.windowEnd) {
      const releaseStart = new Date(selectedReleaseDetails.windowStart);
      const releaseEnd = new Date(selectedReleaseDetails.windowEnd);

      if (startDate < releaseStart || endDate > releaseEnd) {
        setError(`Sprint dates must stay inside ${selectedReleaseDetails.label} (${selectedReleaseDetails.window}).`);
        return;
      }

      const siblingSprintOverlap = (selectedReleaseDetails.sprints || []).find((sprint) =>
        sprint.windowStart && sprint.windowEnd && isRangeOverlap(startDate, endDate, new Date(sprint.windowStart), new Date(sprint.windowEnd)),
      );

      if (siblingSprintOverlap) {
        setError(`That sprint overlaps ${siblingSprintOverlap.name}. Choose the next open window.`);
        return;
      }
    }

    onSubmitDraft({
      type,
      name: draftName,
      parentRelease,
      windowStart: draftStart,
      windowEnd: draftEnd,
      notes: notes.trim(),
    });
    closeModal();
  };

  return (
    <ModalLayout
      title={isRelease ? 'Create Release' : 'Create Sprint'}
      okButton={{ text: isRelease ? 'Create release draft' : 'Create sprint draft', onClick: submitDraft }}
      cancelButton={{ text: 'Cancel' }}
    >
      <form className={cx('release-modal-form')}>
        <div className={cx('release-modal-copy')}>
          {isRelease
            ? 'Create a release grouping draft. Date windows cannot overlap an existing release range.'
            : 'Create a sprint grouping draft. Sprint windows must stay inside the selected release range.'}
        </div>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>{isRelease ? 'Release name' : 'Sprint name'}</span>
          <input
            type="text"
            className={cx('release-modal-input')}
            value={name}
            onChange={(event) => {
              nameTouchedRef.current = true;
              setName(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder={suggestedName}
          />
        </label>

        {!isRelease ? (
          <label className={cx('release-modal-field')}>
            <span className={cx('release-modal-label')}>Parent release</span>
            <select
              className={cx('release-modal-input', 'release-modal-select')}
              value={parentRelease}
              onChange={(event) => setParentRelease(event.target.value)}
            >
              {selectableReleases.length ? selectableReleases.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              )) : <option value={UNRELEASED_TITLE}>{UNRELEASED_TITLE}</option>}
            </select>
          </label>
        ) : null}

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Calendar start</span>
          <input
            type="date"
            className={cx('release-modal-input')}
            value={windowStart}
            onChange={(event) => setWindowStart(event.target.value)}
          />
        </label>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Calendar end</span>
          <input
            type="date"
            className={cx('release-modal-input')}
            value={windowEnd}
            onChange={(event) => setWindowEnd(event.target.value)}
          />
        </label>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Notes</span>
          <textarea
            className={cx('release-modal-textarea')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Optional context for the release owner or dashboard reviewers"
          />
        </label>

        <div className={cx('release-modal-preview')}>
          <div className={cx('release-modal-preview-title')}>Grouping preview</div>
          <div className={cx('release-modal-preview-copy')}>
            {isRelease
              ? `Release name suggestion: ${releaseNameSuggestion}. This range becomes active once the launch dates fall between ${windowStart || defaultWindow.start} and ${windowEnd || defaultWindow.end}.`
              : `Sprint name suggestion: ${sprintNameSuggestion}. The sprint stays under ${selectedReleaseDetails?.label || parentRelease}.`}
          </div>
          {!isRelease && selectedReleaseDetails ? (
            <div className={cx('release-modal-preview-meta')}>
              <span>{selectedReleaseDetails.label}</span>
              {selectedReleaseDetails.window ? <span>{selectedReleaseDetails.window}</span> : null}
              {selectedReleaseDetails.notes ? <span>{selectedReleaseDetails.notes}</span> : null}
            </div>
          ) : null}
        </div>

        {error ? <div className={cx('release-modal-error')}>{error}</div> : null}

        <div className={cx('release-modal-actions')}>
          <Button onClick={hideModal}>Close</Button>
        </div>
      </form>
    </ModalLayout>
  );
};

ReleaseGroupingModal.propTypes = {
  type: PropTypes.oneOf(['release', 'sprint']).isRequired,
  hideModal: PropTypes.func.isRequired,
  onSubmitDraft: PropTypes.func.isRequired,
  releaseOptions: PropTypes.arrayOf(PropTypes.string),
};

ReleaseGroupingModal.defaultProps = {
  releaseOptions: [],
};

const ReleaseFormModal = ({
  title,
  description,
  submitLabel,
  hideModal,
  initialName,
  initialWindowStart,
  initialWindowEnd,
  currentReleaseName,
  existingReleaseWindows,
  onSubmit,
}) => {
  const [name, setName] = React.useState(initialName || '');
  const [windowStart, setWindowStart] = React.useState(initialWindowStart || '');
  const [windowEnd, setWindowEnd] = React.useState(initialWindowEnd || '');
  const [error, setError] = React.useState('');

  const submitRelease = (closeModal) => {
    const trimmedName = String(name || '').trim();
    const startDate = windowStart ? new Date(windowStart) : null;
    const endDate = windowEnd ? new Date(windowEnd) : null;

    if (!trimmedName) {
      setError('Release name is required.');
      return;
    }

    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Select a valid calendar range.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be on or before the end date.');
      return;
    }

    const overlappingRelease = (existingReleaseWindows || []).find((release) => {
      if (!release?.windowStart || !release?.windowEnd) {
        return false;
      }

      if (currentReleaseName && release.name === currentReleaseName) {
        return false;
      }

      return isRangeOverlap(startDate, endDate, new Date(release.windowStart), new Date(release.windowEnd));
    });

    if (overlappingRelease) {
      setError(`Release range overlaps existing release ${overlappingRelease.label}. Choose a non-overlapping window that starts after ${overlappingRelease.windowEnd}.`);
      return;
    }

    onSubmit({
      name: trimmedName,
      windowStart,
      windowEnd,
    });
    closeModal();
  };

  return (
    <ModalLayout
      title={title}
      okButton={{ text: submitLabel, onClick: submitRelease }}
      cancelButton={{ text: 'Cancel' }}
    >
      <form className={cx('release-modal-form')}>
        <div className={cx('release-modal-copy')}>{description}</div>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Release name</span>
          <input
            type="text"
            className={cx('release-modal-input')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Release name"
          />
        </label>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Calendar start</span>
          <input
            type="date"
            className={cx('release-modal-input')}
            value={windowStart}
            onChange={(event) => setWindowStart(event.target.value)}
          />
        </label>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Calendar end</span>
          <input
            type="date"
            className={cx('release-modal-input')}
            value={windowEnd}
            onChange={(event) => setWindowEnd(event.target.value)}
          />
        </label>

        {error ? <div className={cx('release-modal-error')}>{error}</div> : null}

        <div className={cx('release-modal-actions')}>
          <Button onClick={hideModal}>Close</Button>
        </div>
      </form>
    </ModalLayout>
  );
};

ReleaseFormModal.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
  initialName: PropTypes.string,
  initialWindowStart: PropTypes.string,
  initialWindowEnd: PropTypes.string,
  currentReleaseName: PropTypes.string,
  existingReleaseWindows: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    windowStart: PropTypes.string,
    windowEnd: PropTypes.string,
  })),
  onSubmit: PropTypes.func.isRequired,
};

ReleaseFormModal.defaultProps = {
  initialName: '',
  initialWindowStart: '',
  initialWindowEnd: '',
  currentReleaseName: '',
  existingReleaseWindows: [],
};

const ReleaseAssignmentModal = ({
  sprintName,
  releaseOptions,
  onApplyAssignments,
  hideModal,
}) => {
  const selectableReleases = releaseOptions.filter((option) => option.value !== UNRELEASED_TITLE);
  const [targetRelease, setTargetRelease] = React.useState(selectableReleases[0]?.value || '');
  const [error, setError] = React.useState('');

  const submitAssignment = (closeModal) => {
    if (!targetRelease) {
      setError('Select or enter a release name.');
      return;
    }

    onApplyAssignments({
      releaseName: targetRelease,
      sprintName,
    });
    closeModal();
  };

  return (
    <ModalLayout
      title="Add sprint to release"
      okButton={{ text: 'Add sprint', onClick: submitAssignment }}
      cancelButton={{ text: 'Cancel' }}
    >
      <form className={cx('release-modal-form')}>
        <div className={cx('release-modal-copy')}>
          Select the release for sprint {sprintName}.
        </div>

        <label className={cx('release-modal-field')}>
          <span className={cx('release-modal-label')}>Target release</span>
          <select
            className={cx('release-modal-input', 'release-modal-select')}
            value={targetRelease}
            onChange={(event) => setTargetRelease(event.target.value)}
          >
            {selectableReleases.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {error ? <div className={cx('release-modal-error')}>{error}</div> : null}

        <div className={cx('release-modal-actions')}>
          <Button onClick={hideModal}>Close</Button>
        </div>
      </form>
    </ModalLayout>
  );
};

ReleaseAssignmentModal.propTypes = {
  sprintName: PropTypes.string,
  releaseOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    window: PropTypes.string,
    windowStart: PropTypes.string,
    windowEnd: PropTypes.string,
    notes: PropTypes.string,
    draft: PropTypes.bool,
    sprints: PropTypes.array,
  })).isRequired,
  onApplyAssignments: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
};

ReleaseAssignmentModal.defaultProps = {
  sprintName: '',
};

const ReleasesPage = ({ projectId, data, expandedReleaseKeys, onToggleRelease }) => {
  const dispatch = useDispatch();
  const [actionMessage, setActionMessage] = React.useState('');
  const [releaseDrafts, setReleaseDrafts] = React.useState(() => loadReleaseDrafts().map(hydrateDraftRelease));
  const [releaseAssignments, setReleaseAssignments] = React.useState(() => loadReleaseAssignments().map(hydrateReleaseAssignment));
  const [releaseRemovals, setReleaseRemovals] = React.useState(() => loadReleaseRemovals());
  const [releaseFilters, setReleaseFilters] = React.useState({
    dateRange: '30',
    launchName: RELEASE_FILTER_ALL,
    tag: RELEASE_FILTER_ALL,
  });
  const releaseFilterOptions = buildReleaseFilterOptions(data.launches || []);
  const filteredLaunches = buildScopedLaunchWindow(data.launches || [], releaseFilters);
  const releaseWindowIndex = buildReleaseWindowIndex(releaseDrafts);
  const releases = buildReleasesFromLaunches(filteredLaunches, projectId, releaseAssignments, releaseWindowIndex, releaseRemovals);
  const draftReleases = releaseDrafts.map((draft) => ({
    title: draft.name,
    isUnreleased: false,
    autoDetected: false,
    isDraft: true,
    latestTimestamp: draft.createdAt,
    meta: draft.windowStart || draft.windowEnd ? `${draft.windowStart || 'Open'} - ${draft.windowEnd || 'Open'} calendar window` : 'Draft release with no calendar window yet',
    rate: '0%',
    passRate: 0,
    state: 'Draft',
    stateTone: 'neutral',
    sprints: [],
    launchCount: 0,
    sprintCount: 0,
    totalTests: 0,
    window: draft.windowStart || draft.windowEnd ? `${draft.windowStart || 'Open'} - ${draft.windowEnd || 'Open'}` : 'Calendar window pending',
    notes: draft.notes || 'Draft release ready for sprint assignment.',
  }));
  const allReleases = mergeReleaseCollections(draftReleases, releases);
  const { sprintCount, launchCount, attentionCount, latestRelease, releaseDelta, sprintDelta, launchDelta, attentionDelta } = buildReleaseStats(allReleases);
  const releaseOptions = allReleases
    .filter((release) => !release.isUnreleased)
    .map((release) => buildReleaseOption(release));
  const unreleasedRelease = allReleases.find((release) => release.title === UNRELEASED_TITLE) || null;
  const unreleasedSprintOptions = unreleasedRelease?.sprints || [];
  const filteredWindowBounds = getLaunchRangeBounds(filteredLaunches);

  React.useEffect(() => {
    saveReleaseDrafts(releaseDrafts);
  }, [releaseDrafts]);

  React.useEffect(() => {
    saveReleaseAssignments(releaseAssignments);
  }, [releaseAssignments]);

  React.useEffect(() => {
    saveReleaseRemovals(releaseRemovals);
  }, [releaseRemovals]);

  const assignSprintToRelease = ({ sprintName, releaseName }) => {
    const normalizedSprintKey = buildSprintAssignmentKey(sprintName);
    setReleaseAssignments((currentAssignments) => [
      ...currentAssignments.filter((assignment) => buildSprintAssignmentKey(assignment.sprintName) !== normalizedSprintKey),
      { sprintName, releaseName, createdAt: Date.now() },
    ]);

    setReleaseRemovals((currentRemovals) => {
      if (!currentRemovals[sprintName]) {
        return currentRemovals;
      }

      const nextRemovals = { ...currentRemovals };
      delete nextRemovals[sprintName];
      return nextRemovals;
    });
  };

  const removeSprintFromRelease = ({ sprintName, releaseName }) => {
    const normalizedSprintKey = buildSprintAssignmentKey(sprintName);
    setReleaseAssignments((currentAssignments) => currentAssignments.filter((assignment) => buildSprintAssignmentKey(assignment.sprintName) !== normalizedSprintKey));
    setReleaseRemovals((currentRemovals) => ({
      ...currentRemovals,
      [sprintName]: { releaseName, removedAt: Date.now() },
    }));
    setActionMessage(`Moved sprint ${sprintName} back to Unreleased.`);
  };

  const deleteRelease = (release) => {
    if (release.isUnreleased) {
      return;
    }

    const sprintNames = (release.sprints || []).map((sprint) => sprint.name);

    setReleaseDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.name !== release.title));
    setReleaseAssignments((currentAssignments) => currentAssignments.filter((assignment) => assignment.releaseName !== release.title && !sprintNames.includes(assignment.sprintName)));
    setReleaseRemovals((currentRemovals) => {
      const nextRemovals = { ...currentRemovals };
      sprintNames.forEach((sprintName) => {
        nextRemovals[sprintName] = { releaseName: release.title, removedAt: Date.now() };
      });
      return nextRemovals;
    });
    setActionMessage(`Deleted release ${release.title}. Related sprints moved back to Unreleased.`);
  };

  const openReleaseFormModal = (release = null) => {
    const releaseTitle = release?.title || '';
    const existingReleaseWindows = allReleases
      .filter((item) => item.windowStart && item.windowEnd)
      .map((item) => ({
        name: item.title,
        label: item.title,
        windowStart: item.windowStart,
        windowEnd: item.windowEnd,
      }));
    const hideModal = () => dispatch(hideModalAction());

    dispatch(
      showModalAction({
        component: (
          <ReleaseFormModal
            title={release ? 'Edit Release' : 'Add Release'}
            description={release ? 'Update the release name or calendar window.' : 'Create a local release management entry.'}
            submitLabel={release ? 'Save release' : 'Add release'}
            hideModal={hideModal}
            initialName={releaseTitle}
            initialWindowStart={release?.windowStart || filteredWindowBounds.start}
            initialWindowEnd={release?.windowEnd || filteredWindowBounds.end}
            currentReleaseName={releaseTitle}
            existingReleaseWindows={existingReleaseWindows}
            onSubmit={({ name, windowStart, windowEnd }) => {
              const createdAt = release?.latestTimestamp || Date.now();

              setReleaseDrafts((currentDrafts) => {
                const remainingDrafts = currentDrafts.filter((draft) => draft.name !== releaseTitle && draft.name !== name);
                return [
                  {
                    name,
                    windowStart,
                    windowEnd,
                    notes: release?.notes || 'Managed release entry.',
                    createdAt,
                  },
                  ...remainingDrafts,
                ];
              });

              if (releaseTitle && releaseTitle !== name) {
                setReleaseAssignments((currentAssignments) => currentAssignments.map((assignment) => (
                  assignment.releaseName === releaseTitle ? { ...assignment, releaseName: name } : assignment
                )));
              }

              setActionMessage(release ? `Updated release ${name}.` : `Added release ${name}.`);
            }}
          />
        ),
      }),
    );
  };

  const openAssignmentModal = (sprint) => {
    const hideModal = () => dispatch(hideModalAction());

    dispatch(
      showModalAction({
        component: (
          <ReleaseAssignmentModal
            sprintName={sprint?.name || ''}
            releaseOptions={releaseOptions.length ? releaseOptions : [buildReleaseOption({ title: UNRELEASED_TITLE })]}
            hideModal={hideModal}
            onApplyAssignments={({ releaseName, sprintName: currentSprintName }) => {
              assignSprintToRelease({ sprintName: currentSprintName || sprint?.name, releaseName });
              setActionMessage(`Assigned sprint ${currentSprintName || sprint?.name} to ${releaseName}.`);
            }}
          />
        ),
      }),
    );
  };

  const updateReleaseFilter = (field) => (event) => {
    setReleaseFilters((previousFilters) => ({
      ...previousFilters,
      [field]: event.target.value,
    }));
  };

  const openDraftModal = (type) => {
    const hideModal = () => dispatch(hideModalAction());
    dispatch(
      showModalAction({
        component: (
          <ReleaseGroupingModal
            type={type}
            hideModal={hideModal}
            releaseOptions={releaseOptions.length ? releaseOptions : [buildReleaseOption({ title: UNRELEASED_TITLE })]}
            onSubmitDraft={(draft) => {
              if (draft.type === 'release') {
                const createdAt = Date.now();
                setReleaseDrafts((currentDrafts) => [
                  {
                    name: draft.name,
                    windowStart: draft.windowStart,
                    windowEnd: draft.windowEnd,
                    notes: draft.notes,
                    createdAt,
                  },
                  ...currentDrafts,
                ]);
                setActionMessage(
                  `Release draft "${draft.name}" prepared. Apply attribute release=${draft.name} to the launches you want grouped${draft.windowStart || draft.windowEnd ? ` for ${draft.windowStart || '...'}${draft.windowStart && draft.windowEnd ? ' to ' : ''}${draft.windowEnd || '...'}` : ''}.`,
                );
                return;
              }

              if (draft.parentRelease === UNRELEASED_TITLE) {
                const createdAt = Date.now();
                setReleaseDrafts((currentDrafts) => [
                  {
                    name: draft.name,
                    windowStart: draft.windowStart,
                    windowEnd: draft.windowEnd,
                    notes: draft.notes,
                    createdAt,
                  },
                  ...currentDrafts,
                ]);
              }

              setActionMessage(
                `Sprint draft "${draft.name}" prepared under "${draft.parentRelease}". Apply attribute sprint=${draft.name} to the relevant launches${draft.windowStart || draft.windowEnd ? ` for ${draft.windowStart || '...'}${draft.windowStart && draft.windowEnd ? ' to ' : ''}${draft.windowEnd || '...'}` : ''}.`,
              );
            }}
          />
        ),
      }),
    );
  };

  const releaseKpis = [
    {
      label: 'Latest release health',
      value: latestRelease?.rate || '0%',
      note: latestRelease ? `${latestRelease.title} ${latestRelease.state.toLowerCase()}` : 'No release groups detected',
      delta: releaseDelta,
      tone: latestRelease?.stateTone || 'neutral',
    },
    {
      label: 'Sprints covered',
      value: String(sprintCount),
      note: 'Release windows currently grouped from live launch attributes',
      delta: sprintDelta,
      tone: 'info',
    },
    {
      label: 'Tracked launches',
      value: String(launchCount),
      note: 'Launches currently contributing to release-level health',
      delta: launchDelta,
      tone: 'success',
    },
    {
      label: 'Needs attention',
      value: String(attentionCount),
      note: 'Release groups with warning or danger state',
      delta: attentionDelta,
      tone: attentionCount > 0 ? 'danger' : 'success',
    },
  ];

  if (!releases.length) {
    return (
      <div className={cx('summary-empty-state')}>
        <div className={cx('summary-empty-title')}>No releases can be built from the current launches.</div>
        <div className={cx('summary-empty-copy')}>
          Launches need execution history before release and sprint insights can be calculated.
        </div>
      </div>
    );
  }

  return (
    <div className={cx('release-dashboard-shell')}>
      <div className={cx('summary-filter-bar')}>
        <label className={cx('summary-filter-field')}>
          <span className={cx('summary-filter-label')}>Date range</span>
          <select className={cx('select', 'summary-filter-select')} value={releaseFilters.dateRange} onChange={updateReleaseFilter('dateRange')}>
            {releaseFilterOptions.dateRange.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className={cx('summary-filter-field')}>
          <span className={cx('summary-filter-label')}>Launch name</span>
          <select className={cx('select', 'summary-filter-select')} value={releaseFilters.launchName} onChange={updateReleaseFilter('launchName')}>
            {releaseFilterOptions.launchName.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className={cx('summary-filter-field')}>
          <span className={cx('summary-filter-label')}>Tag</span>
          <select className={cx('select', 'summary-filter-select')} value={releaseFilters.tag} onChange={updateReleaseFilter('tag')}>
            {releaseFilterOptions.tag.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className={cx('summary-filter-meta')}>
          <div className={cx('summary-filter-kicker')}>Release scope</div>
          <div className={cx('summary-filter-copy')}>
            Filter launches before release and sprint grouping so the release dashboard stays aligned with the same metadata rules as Quick Summary.
          </div>
        </div>
      </div>

      <div className={cx('release-dashboard-header')}>
        <div>
          <div className={cx('release-dashboard-title')}>Releases</div>
          <div className={cx('release-dashboard-copy')}>
              Executive release health built from live launch attributes. Auto-detected weekly sprint buckets fill in missing grouping, while Create Release and Create Sprint remain manual fallback tools.
          </div>
        </div>
        <div className={cx('release-dashboard-actions')}>
          <Button primary onClick={() => openReleaseFormModal()}>Add Release</Button>
          <Button onClick={() => openDraftModal('sprint')}>Create Sprint</Button>
        </div>
      </div>

      {actionMessage ? <div className={cx('status-message')}>{actionMessage}</div> : null}

      <div className={cx('release-kpi-grid')}>
        {releaseKpis.map((kpi) => (
          <div key={kpi.label} className={cx('release-kpi-card', `release-kpi-${kpi.tone}`)}>
            <div className={cx('release-kpi-topline')}>
              <span className={cx('release-kpi-label')}>{kpi.label}</span>
              <Badge tone={kpi.delta.tone}>{kpi.delta.text}</Badge>
            </div>
            <div className={cx('release-kpi-value')}>{kpi.value}</div>
            <div className={cx('release-kpi-note')}>{kpi.note}</div>
          </div>
        ))}
      </div>

      {allReleases.map((release, releaseIndex) => {
        const previousRelease = allReleases[releaseIndex + 1] || null;
        const releaseDeltaText = formatDelta(release.passRate, previousRelease?.passRate, 'pts');

        return (
          <section key={release.title} className={cx('release-executive-card', { 'release-executive-card-unreleased': release.isUnreleased })}>
            <div className={cx('release-executive-header')}>
              <div className={cx('release-executive-main')}>
                <div className={cx('release-executive-title-row')}>
                  <div className={cx('release-executive-title')}>{release.title}</div>
                  <div className={cx('release-executive-badges')}>
                    {release.autoDetected ? <Badge tone="info">Auto-detected</Badge> : null}
                    <Badge tone={release.stateTone}>{release.state}</Badge>
                  </div>
                </div>
                <div className={cx('release-executive-copy')}>{release.meta}</div>
              </div>
              {release.isDraft ? (
                <div className={cx('release-executive-actions')}>
                  <Button onClick={() => openReleaseFormModal(release)}>Edit</Button>
                  <Button onClick={() => deleteRelease(release)}>Delete</Button>
                </div>
              ) : null}
              <div className={cx('release-executive-stats')}>
                <div className={cx('release-executive-rate')}>{release.rate}</div>
                <div className={cx('release-executive-rate-copy')}>Release pass rate</div>
                <Badge tone={releaseDeltaText.tone}>{releaseDeltaText.text}</Badge>
              </div>
            </div>

            <div className={cx('release-overview-grid')}>
              <div className={cx('release-overview-card')}>
                <div className={cx('release-overview-label')}>Coverage</div>
                <div className={cx('release-overview-value')}>{release.sprints.length} sprints</div>
                <div className={cx('release-overview-copy')}>
                  {release.launchCount} launches and {release.totalTests} test cases contributing to this release.
                </div>
                <ProgressBar value={release.passRate} tone={release.stateTone} label={`Release pass rate ${release.rate}`} />
              </div>
              <div className={cx('release-overview-card')}>
                <div className={cx('release-overview-label')}>Sprint trend</div>
                <div className={cx('release-overview-trend-stack')}>
                  {release.sprints.map((sprint) => (
                    <div
                      key={`${release.title}-${sprint.name}`}
                      className={cx('release-overview-segment')}
                      style={{ flexGrow: Math.max(sprint.totalTests, 1) }}
                      title={`${sprint.name}: ${sprint.rate} pass rate across ${sprint.totalTests} tests`}
                    >
                      <div className={cx('release-overview-segment-track')}>
                        <div
                          className={cx('release-overview-segment-fill', `release-overview-segment-${sprint.tone}`)}
                          style={{ width: `${Math.max(parseRate(sprint.rate), 4)}%` }}
                        />
                      </div>
                      <div className={cx('release-overview-segment-meta')}>
                        <span>{sprint.name}</span>
                        <strong>{sprint.rate}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={cx('release-overview-copy')}>
                  Each segment shows sprint pass rate and carries proportional width based on total test volume.
                </div>
              </div>
            </div>

            <div className={cx('release-sprint-shell')}>
              <div className={cx('release-sprint-shell-label')}>Sprint groups</div>
              <div className={cx('release-accordion-list')}>
              {(release.sprints || []).map((sprint) => {
                const sprintKey = `${release.title}-${sprint.name}`;
                const isExpanded = expandedReleaseKeys.includes(sprintKey);
                const sprintStats = {
                  launchCount: sprint.launchCount,
                  passedTotal: sprint.passedTotal,
                  failedTotal: sprint.failedTotal,
                  blockedTotal: sprint.blockedTotal,
                  totalTests: sprint.totalTests,
                  passRate: parseRate(sprint.rate),
                  attentionCount: sprint.launchRates.filter((launch) => launch.tone === 'danger' || launch.tone === 'warning').length,
                  launchRates: sprint.launchRates,
                };
                const accordionId = `release-accordion-${releaseIndex}-${sprint.name.replace(/\s+/g, '-').toLowerCase()}`;

                return (
                  <div key={sprintKey} className={cx('release-accordion-item', { 'release-accordion-item-open': isExpanded })}>
                    <button
                      type="button"
                      className={cx('release-accordion-trigger')}
                      onClick={() => onToggleRelease(sprintKey)}
                      aria-expanded={isExpanded}
                      aria-controls={accordionId}
                    >
                      <span className={cx('release-chevron', { 'release-chevron-open': isExpanded })}>{'▸'}</span>
                      <div className={cx('release-accordion-main')}>
                        <div className={cx('release-accordion-title-row')}>
                          <div>
                            <div className={cx('release-accordion-kicker')}>Sprint</div>
                            <span className={cx('release-accordion-title')}>{sprint.name}</span>
                          </div>
                          <div className={cx('release-accordion-badges')}>
                            {sprint.autoDetected ? <Badge tone="info">Auto-detected</Badge> : null}
                            <Badge tone={sprint.tone}>{sprint.state}</Badge>
                          </div>
                        </div>
                        <div className={cx('release-accordion-copy')}>{sprint.dates} · {sprint.launchCount} launches · {sprint.totalTests} test cases</div>
                      </div>
                      <div className={cx('release-accordion-side')}>
                        <strong>{sprint.rate}</strong>
                        <span>{sprintStats.attentionCount} needing review</span>
                      </div>
                    </button>

                    <div className={cx('release-accordion-actions')}>
                      {release.isUnreleased ? (
                        <Button onClick={() => openAssignmentModal(sprint)}>Add sprint to release</Button>
                      ) : (
                        <Button onClick={() => removeSprintFromRelease({ sprintName: sprint.name, releaseName: release.title })}>Remove from release</Button>
                      )}
                    </div>

                    {isExpanded ? (
                      <div id={accordionId} className={cx('release-accordion-content')}>
                        <div className={cx('release-sprint-summary-grid')}>
                          <div className={cx('release-sprint-summary-card')}>
                            <div className={cx('release-overview-label')}>Tests run</div>
                            <div className={cx('release-sprint-summary-value')}>{sprintStats.totalTests}</div>
                            <div className={cx('release-sprint-summary-copy')}>Total test executions recorded in this sprint.</div>
                          </div>
                          <div className={cx('release-sprint-summary-card')}>
                            <div className={cx('release-overview-label')}>Cases run</div>
                            <div className={cx('release-sprint-summary-value')}>{sprintStats.testCasesRun}</div>
                            <div className={cx('release-sprint-summary-copy')}>Case count mirrors the execution volume in the sprint window.</div>
                          </div>
                        </div>

                        {sprint.launches && sprint.launches.length ? (
                          <div className={cx('release-launch-card-grid')}>
                            {sprint.launches.map((launch) => {
                              const launchStats = buildLaunchStats(launch);

                              return (
                                <ResourceLink key={String(launchStats.launchId || launchStats.launch)} projectId={projectId} launchId={launchStats.launchId} launchName={launchStats.launch} className={cx('release-launch-card-link')}>
                                  <div className={cx('release-launch-card')}>
                                    <div className={cx('release-launch-card-topline')}>
                                      <div>
                                        <div className={cx('release-launch-card-title')}>{launchStats.launch}</div>
                                        <div className={cx('release-launch-card-meta')}>{launchStats.started} · {launchStats.owner || 'No owner'}</div>
                                      </div>
                                      <Badge tone={launchStats.tone}>{launchStats.status}</Badge>
                                    </div>
                                    <div className={cx('release-launch-card-copy')}>
                                      {launchStats.total} tests run · {launchStats.passed} passed · {launchStats.failed} failed
                                    </div>
                                  </div>
                                </ResourceLink>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

ReleasesPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  expandedReleaseKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleRelease: PropTypes.func.isRequired,
};

export default ReleasesPage;
