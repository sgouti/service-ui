import { fetch } from 'common/utils/fetch';
import { URLS } from 'common/urls';
import {
  QUICK_SUMMARY_SECTION,
  CLUSTER_VIEW_SECTION,
  ML_ANALYSER_SECTION,
  FLAKINESS_SECTION,
  TRENDS_SECTION,
  DURATION_SECTION,
} from './constants';

const DEFAULT_LAUNCH_SIZE = 50;

const statusTone = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'PASSED':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'SKIPPED':
      return 'warning';
    case 'INTERRUPTED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${formatDate(isoString)}`;
};

const getDefectTotal = (defects, key) => defects?.[key]?.total || 0;

const buildDefectBreakdown = (launches) => {
  const totals = { product_bug: 0, system_issue: 0, automation_bug: 0, to_investigate: 0 };
  launches.forEach((l) => {
    const d = l.statistics?.defects || {};
    totals.product_bug += getDefectTotal(d, 'product_bug');
    totals.system_issue += getDefectTotal(d, 'system_issue');
    totals.automation_bug += getDefectTotal(d, 'automation_bug');
    totals.to_investigate += getDefectTotal(d, 'to_investigate');
  });
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return [
    ['Product bug', String(totals.product_bug), pct(totals.product_bug, sum), 'danger'],
    ['System issue', String(totals.system_issue), pct(totals.system_issue, sum), 'warning'],
    ['Automation bug', String(totals.automation_bug), pct(totals.automation_bug, sum), 'info'],
    ['To investigate', String(totals.to_investigate), pct(totals.to_investigate, sum), 'neutral'],
  ].filter(([, count]) => Number(count) > 0);
};

const buildTestItemRows = (items, launches) => {
  const launchMap = {};
  launches.forEach((l) => {
    launchMap[l.id] = l;
  });
  return items.map((item) => {
    const launch = launchMap[item.launchId] || {};
    const launchLabel = `${launch.name || 'Launch'} #${launch.number || item.launchId}`;
    const exec = item.statistics?.executions || {};
    const total = exec.total || 1;
    const passRate = pct(exec.passed || 0, total);
    const defects = item.statistics?.defects || {};
    let defectType = 'To investigate';
    let defectTone = 'neutral';
    if (getDefectTotal(defects, 'product_bug') > 0) {
      defectType = 'Product bug';
      defectTone = 'danger';
    } else if (getDefectTotal(defects, 'system_issue') > 0) {
      defectType = 'System issue';
      defectTone = 'warning';
    } else if (getDefectTotal(defects, 'automation_bug') > 0) {
      defectType = 'Automation bug';
      defectTone = 'info';
    }
    return {
      id: item.id,
      name: item.name,
      launchId: item.launchId,
      launchLabel,
      passRate: `${passRate}%`,
      defectType,
      defectTone,
      status: item.status,
      startTime: item.startTime,
      duration: formatDuration(
        item.endTime && item.startTime
          ? (new Date(item.endTime) - new Date(item.startTime)) / 1000
          : 0,
      ),
    };
  });
};

export const fetchLaunchData = async (projectId) => {
  const url = URLS.launches(projectId, []);
  const launchUrl = `${url.split('?')[0]}?page.size=${DEFAULT_LAUNCH_SIZE}&page.sort=startTime,number,DESC`;
  const response = await fetch(launchUrl);
  const launches = response?.content || [];
  return launches;
};

export const fetchTestItems = async (projectId, launchId) => {
  const url = `${URLS.testItems(projectId).split('?')[0]}?filter.eq.launchId=${launchId}&page.size=50&page.sort=startTime,ASC&isLatest=false&launchesLimit=0`;
  const response = await fetch(url);
  return response?.content || [];
};

export const transformLaunchesToInsightsData = (launches, projectId) => {
  const totalLaunches = launches.length;
  const passedLaunches = launches.filter((l) => l.status === 'PASSED').length;
  const failedLaunches = totalLaunches - passedLaunches;
  const passRate = pct(passedLaunches, totalLaunches);

  const totalTests = launches.reduce((s, l) => s + (l.statistics?.executions?.total || 0), 0);
  const totalFailed = launches.reduce((s, l) => s + (l.statistics?.executions?.failed || 0), 0);
  const totalPassed = launches.reduce((s, l) => s + (l.statistics?.executions?.passed || 0), 0);

  const totalDefects = launches.reduce((s, l) => {
    const d = l.statistics?.defects || {};
    return (
      s +
      getDefectTotal(d, 'product_bug') +
      getDefectTotal(d, 'system_issue') +
      getDefectTotal(d, 'automation_bug') +
      getDefectTotal(d, 'to_investigate')
    );
  }, 0);

  let failureStreak = 0;
  for (let i = 0; i < launches.length; i++) {
    if (launches[i].status === 'FAILED') failureStreak++;
    else break;
  }

  const latestLaunch = launches[0] || {};

  const sprintRows = launches.map((l) => {
    const exec = l.statistics?.executions || {};
    const lPassRate = pct(exec.passed || 0, exec.total || 1);
    return [
      `${l.name} #${l.number}`,
      l.status === 'PASSED' ? 'Passed' : 'Failed',
      `${lPassRate}%`,
      String(exec.failed || 0),
      statusTone(l.status),
      l.id,
    ];
  });

  const passRateTrend = [...launches].reverse().map((l) => {
    const exec = l.statistics?.executions || {};
    return pct(exec.passed || 0, exec.total || 1);
  });

  const failureCountTrend = [...launches].reverse().map((l) => l.statistics?.executions?.failed || 0);

  const summaryTrend = passRateTrend;

  const defectBreakdown = buildDefectBreakdown(launches);

  const alertHighlights = [];
  if (failedLaunches > 0) {
    alertHighlights.push({
      title: `${failedLaunches} launch${failedLaunches > 1 ? 'es' : ''} failed`,
      description: `${failedLaunches} of ${totalLaunches} launches did not pass`,
      time: formatTime(latestLaunch.startTime),
      tone: 'danger',
    });
  }
  if (totalDefects > 0) {
    alertHighlights.push({
      title: `${totalDefects} defect${totalDefects > 1 ? 's' : ''} detected`,
      description: 'Across all launches in the project',
      time: formatTime(latestLaunch.startTime),
      tone: 'warning',
    });
  }
  const groupedReleases = {};
  
  launches.forEach((l) => {
    let launchTimeMs = Date.now();
    if (l.startTime) {
      const parsedAsString = new Date(l.startTime).getTime();
      const numCast = Number(l.startTime);
      if (!isNaN(parsedAsString)) {
        launchTimeMs = parsedAsString;
      } else if (!isNaN(numCast)) {
        launchTimeMs = numCast;
      }
    }
    const launchBaseName = l.name ? l.name.trim() : 'Unnamed Test';
    const launchMonthYear = new Date(launchTimeMs).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const autoReleaseName = `${launchBaseName} - ${launchMonthYear}`;

    const sprintBucketDuration = 14 * 24 * 60 * 60 * 1000;
    const sprintBucketNum = Math.floor(launchTimeMs / sprintBucketDuration);
    const sprintStart = new Date(sprintBucketNum * sprintBucketDuration);
    const sprintEnd = new Date((sprintBucketNum + 1) * sprintBucketDuration - 1);
    const sprintRangeLabel = `${sprintStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${sprintEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const autoSprintName = `Sprint (${sprintRangeLabel})`;

    const releaseAttr = l.attributes?.find((a) => a.key === 'release')?.value || autoReleaseName;
    const sprintAttr = l.attributes?.find((a) => a.key === 'sprint')?.value || autoSprintName;
    if (!groupedReleases[releaseAttr]) {
      groupedReleases[releaseAttr] = {};
    }
    if (!groupedReleases[releaseAttr][sprintAttr]) {
      groupedReleases[releaseAttr][sprintAttr] = [];
    }
    groupedReleases[releaseAttr][sprintAttr].push(l);
  });

  const releases = Object.entries(groupedReleases).map(([releaseName, sprints]) => {
    const allLaunchesInRelease = Object.values(sprints).flat();
    const passedInRelease = allLaunchesInRelease.filter(l => l.status === 'PASSED').length;
    const releaseRate = pct(passedInRelease, allLaunchesInRelease.length);
    
    return {
      title: releaseName,
      meta: `${allLaunchesInRelease.length} launches in ${projectId}`,
      rate: `${releaseRate}%`,
      state: releaseRate >= 80 ? 'Healthy' : 'Needs attention',
      stateTone: releaseRate >= 80 ? 'success' : releaseRate >= 50 ? 'warning' : 'danger',
      sprints: Object.entries(sprints).map(([sprintName, sprintLaunches]) => {
        const passedInSprint = sprintLaunches.filter(l => l.status === 'PASSED').length;
        const sprintTests = sprintLaunches.reduce((si, li) => si + (li.statistics?.executions?.total || 0), 0);
        return {
          name: sprintName,
          dates: `${formatDate(sprintLaunches[sprintLaunches.length - 1]?.startTime)}–${formatDate(sprintLaunches[0]?.startTime)}`,
          meta: `${sprintLaunches.length} launches, ${sprintTests} test cases`,
          rate: `${pct(passedInSprint, sprintLaunches.length)}%`,
          state: 'Completed',
          tone: pct(passedInSprint, sprintLaunches.length) >= 80 ? 'success' : 'warning',
          launches: sprintLaunches.map((l) => {
             const exec = l.statistics?.executions || {};
             return [
               `${l.name} #${l.number}`,
               l.description?.substring(0, 40) || 'Launch',
               l.status === 'PASSED' ? 'Passed' : 'Failed',
               String(exec.total || 0),
               String(exec.failed || 0),
               l.owner || '',
               formatTime(l.startTime),
               statusTone(l.status),
               l.id,
             ];
          }),
        };
      }),
    };
  });

  const metricCards = {
    [QUICK_SUMMARY_SECTION]: [
      { label: 'Total launches', value: String(totalLaunches), note: `in ${projectId}`, tone: 'info' },
      {
        label: 'Failed launches',
        value: String(failedLaunches),
        note: failedLaunches > 0 ? `${failedLaunches} did not pass` : 'All passed',
        tone: failedLaunches > 0 ? 'danger' : 'success',
      },
      {
        label: 'Passed launches',
        value: String(passedLaunches),
        note: passedLaunches > 0 ? 'completed successfully' : 'none passed',
        tone: passedLaunches > 0 ? 'success' : 'danger',
      },
      {
        label: 'Total test cases',
        value: String(totalTests),
        note: `${totalPassed} passed, ${totalFailed} failed`,
        tone: 'neutral',
      },
    ],
    [CLUSTER_VIEW_SECTION]: [
      { label: 'Failed launches', value: String(failedLaunches) },
      { label: 'Total defects', value: String(totalDefects), note: 'across all launches' },
      {
        label: 'To investigate',
        value: String(
          launches.reduce((s, l) => s + getDefectTotal(l.statistics?.defects || {}, 'to_investigate'), 0),
        ),
        tone: 'warning',
      },
    ],
    [ML_ANALYSER_SECTION]: [
      { label: 'Launches analysed', value: String(totalLaunches) },
      { label: 'Total test cases', value: String(totalTests) },
      { label: 'Total defects', value: String(totalDefects) },
    ],
    [FLAKINESS_SECTION]: [
      {
        label: 'Total test cases',
        value: String(totalTests),
        note: 'across all launches',
        tone: 'warning',
      },
      {
        label: 'Observed instability',
        value: `${pct(failedLaunches, totalLaunches)}%`,
        note: `${failedLaunches} of ${totalLaunches} launches failed`,
        tone: failedLaunches > 0 ? 'danger' : 'success',
      },
      {
        label: 'Pass rate',
        value: `${passRate}%`,
        note: `${passedLaunches} launches passed`,
        tone: passRate >= 80 ? 'success' : passRate >= 50 ? 'warning' : 'danger',
      },
    ],
    [TRENDS_SECTION]: [
      {
        label: 'Launch pass rate',
        value: `${passRate}%`,
        note: `${passedLaunches} passed of ${totalLaunches}`,
        tone: passRate >= 80 ? 'success' : passRate >= 50 ? 'warning' : 'danger',
      },
      {
        label: 'Failure streak',
        value: String(failureStreak),
        note: failureStreak > 0 ? `latest ${failureStreak} launch(es)` : 'no recent streak',
        tone: failureStreak > 0 ? 'danger' : 'success',
      },
      {
        label: 'Latest launch',
        value: `#${latestLaunch.number || '?'}`,
        note: `${latestLaunch.name || ''} ${latestLaunch.status === 'PASSED' ? 'passed' : 'failed'}`,
        tone: statusTone(latestLaunch.status),
      },
    ],
    [DURATION_SECTION]: [
      { label: 'Total test cases', value: String(totalTests), tone: 'neutral' },
      {
        label: 'Longest launch',
        value: formatDuration(
          Math.max(...launches.map((l) => l.approximateDuration || 0)),
        ),
        tone: 'warning',
      },
      {
        label: 'Fastest launch',
        value: formatDuration(
          Math.min(...launches.filter((l) => l.approximateDuration > 0).map((l) => l.approximateDuration)) || 0,
        ),
        tone: 'success',
      },
    ],
  };

  const summaryDashboard = {
    tiles: [
      {
        label: 'Pass rate',
        value: `${passRate}%`,
        note: passRate >= 80 ? '↑ healthy' : `↓ ${failedLaunches} failed`,
        tone: passRate >= 80 ? 'success' : passRate >= 50 ? 'warning' : 'danger',
        bar: passRate,
      },
      {
        label: 'Total failures',
        value: String(totalFailed),
        note: `${totalFailed} test failures`,
        tone: totalFailed > 0 ? 'danger' : 'success',
        bar: pct(totalFailed, totalTests || 1),
      },
      {
        label: 'Defects',
        value: String(totalDefects),
        note: `across ${totalLaunches} launches`,
        tone: totalDefects > 0 ? 'warning' : 'success',
        bar: Math.min(totalDefects * 10, 100),
      },
      {
        label: 'Launches',
        value: String(totalLaunches),
        note: `${passedLaunches} passed · ${failedLaunches} failed`,
        tone: 'info',
        bar: pct(passedLaunches, totalLaunches),
      },
      {
        label: 'Latest',
        value: `#${latestLaunch.number || '?'}`,
        note: latestLaunch.status === 'PASSED' ? 'passed' : 'failed',
        tone: statusTone(latestLaunch.status),
        bar: latestLaunch.status === 'PASSED' ? 100 : 0,
      },
    ],
    qualityHealth: {
      passRate,
      flakinessRate: pct(failedLaunches, totalLaunches),
      failureRate: pct(totalFailed, totalTests || 1),
    },
    activeSprint: {
      name: `Run ${totalLaunches}`,
      version: latestLaunch.attributes?.find((a) => a.key === 'build')?.value || latestLaunch.name || '',
      progress: pct(passedLaunches, totalLaunches),
      dates: `${formatDate(launches[launches.length - 1]?.startTime)}–${formatDate(latestLaunch.startTime)}`,
      dayLabel: `${totalLaunches} launches`,
      stats: [
        ['Launches run', String(totalLaunches)],
        ['Avg pass rate', `${passRate}%`],
        ['Total failures', String(totalFailed)],
        ['Total defects', String(totalDefects)],
      ],
      trendValues: passRateTrend,
      trendLabels: [...launches].reverse().map((l) => `#${l.number}`),
      trendIds: [...launches].reverse().map((l) => l.id),
    },
    passRateAvg: `${passRate}% avg`,
    trendLabels: [...launches].reverse().map((l) => `#${l.number}`),
    trendIds: [...launches].reverse().map((l) => l.id),
  };

  const durationRows = launches.map((l) => {
    const dur = l.approximateDuration || 0;
    const avgDur =
      launches.reduce((s, la) => s + (la.approximateDuration || 0), 0) / (totalLaunches || 1);
    const delta = avgDur > 0 ? Math.round(((dur - avgDur) / avgDur) * 100) : 0;
    const absDelta = Math.abs(delta);
    let tone = 'neutral';
    if (delta > 20) tone = 'danger';
    else if (delta > 10) tone = 'warning';
    else if (delta < -10) tone = 'success';
    return [
      `${l.name} #${l.number}`,
      formatDuration(dur),
      formatDuration(avgDur),
      `${delta >= 0 ? '+' : ''}${delta}%`,
      Math.min(absDelta * 3, 100),
      tone,
      l.id,
    ];
  });

  const launchIdMap = {};
  launches.forEach((l) => {
    launchIdMap[l.id] = l;
    launchIdMap[`${l.name} #${l.number}`] = l;
  });

  return {
    launches,
    launchIdMap,
    metricCards,
    summaryDashboard,
    summaryBreakdownRows: [],
    sprintRows,
    alertHighlights,
    releases,
    clusters: [],
    novelFailures: [],
    similarFailures: [],
    analysisPipeline: [
      ['Input', `${totalLaunches} launches`, `${totalTests} test cases`],
      ['Step 1', 'Log parser', 'exception and root line'],
      ['Step 2', 'MiniLM embed', '384-dim vector'],
      ['Step 3', 'FAISS search', 'nearest-neighbour'],
      ['Step 4', 'HDBSCAN', 'cluster by proximity'],
      ['Output', 'Labelled groups', `${totalDefects} defects found`],
    ],
    defectBreakdown,
    analysisRows: [],
    flakyTests: [],
    durationRows,
    searchResults: [],
    searchHowItWorks: [
      ['BM25', 'Exact match on error codes and class names', 70, 'warning'],
      ['FAISS semantic', 'Finds similar error meaning', 85, 'info'],
      ['RRF merge', 'Combines both without weight tuning', 100, 'success'],
    ],
    alertRules: [],
    alertHistory: [],
    shareLinks: [],
    summaryTrend,
    flakinessTrend: failureCountTrend,
    passRateTrend,
    failureCountTrend,
    shareViewsTrend: [0],
    searchBreakdown: defectBreakdown.map(([label, count, , tone]) => [label, Number(count), tone]),
    failureCardPresets: [],
    testLaunchMap: {},
    defaultSearchTerm: '',
    shareDashboards: [],
  };
};
