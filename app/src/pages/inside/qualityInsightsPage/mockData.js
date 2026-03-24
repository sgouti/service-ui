import {
  ALERTS_SECTION,
  CLUSTER_VIEW_SECTION,
  DURATION_SECTION,
  FAILURE_CARD_SECTION,
  FAILURE_SEARCH_SECTION,
  FLAKINESS_SECTION,
  ML_ANALYSER_SECTION,
  QUICK_SUMMARY_SECTION,
  RELEASES_SECTION,
  TRENDS_SECTION,
} from './constants';



export const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { id: QUICK_SUMMARY_SECTION, label: 'Quick summary', accent: 'neutral' },
      { id: RELEASES_SECTION, label: 'Releases', accent: 'neutral' },
    ],
  },
  {
    title: 'Failure analysis',
    items: [
      { id: CLUSTER_VIEW_SECTION, label: 'Cluster view', accent: 'danger', badge: 'New' },
      { id: FAILURE_CARD_SECTION, label: 'Failure card', accent: 'danger', badge: 'New' },
      { id: ML_ANALYSER_SECTION, label: 'ML analyser', accent: 'danger', badge: 'New' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: FLAKINESS_SECTION, label: 'Flakiness', accent: 'success', badge: 'New' },
      { id: TRENDS_SECTION, label: 'Trends', accent: 'success', badge: 'New' },
      { id: DURATION_SECTION, label: 'Duration', accent: 'warning', badge: 'New' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: FAILURE_SEARCH_SECTION, label: 'Failure search', accent: 'success', badge: 'New' },
      { id: ALERTS_SECTION, label: 'Alerts', accent: 'warning', badge: 'New' },
    ],
  },
];

export const sectionTitles = {
  [QUICK_SUMMARY_SECTION]: 'Quick summary',
  [RELEASES_SECTION]: 'Releases',
  [CLUSTER_VIEW_SECTION]: 'Cluster view',
  [FAILURE_CARD_SECTION]: 'Smart failure card',
  [ML_ANALYSER_SECTION]: 'ML analyser',
  [FLAKINESS_SECTION]: 'Flakiness report',
  [TRENDS_SECTION]: 'Pass rate trends',
  [DURATION_SECTION]: 'Duration trends',
  [FAILURE_SEARCH_SECTION]: 'Failure search',
  [ALERTS_SECTION]: 'Alerts',
};

export const metricCards = {
  [QUICK_SUMMARY_SECTION]: [
    { label: 'Demo launches', value: '5', note: 'Demo Api Tests #1-#5', tone: 'info' },
    { label: 'Failed launches', value: '4', note: 'launches #1-#4 failed', tone: 'danger' },
    { label: 'Passed launches', value: '1', note: 'launch #5 passed', tone: 'success' },
    { label: 'Demo test cases', value: '8', note: '39 demo steps across 7 suites', tone: 'neutral' },
  ],
  [CLUSTER_VIEW_SECTION]: [
    { label: 'Failed launches', value: '4' },
    { label: 'Clusters formed', value: '2', note: 'grouped from Demo Api Tests failures' },
    { label: 'Novel cases', value: '3', note: 'demo cases without close match', tone: 'danger' },
  ],
  [ML_ANALYSER_SECTION]: [
    { label: 'Launches analysed', value: '5' },
    { label: 'Known demo tests', value: '8', note: 'from Demo Api Tests' },
    { label: 'Cluster split', value: '2 + 3', note: '2 repeated groups and 3 novel cases' },
  ],
  [FLAKINESS_SECTION]: [
    { label: 'Repeated demo tests', value: '5', note: 'same names across Demo Api Tests runs', tone: 'warning' },
    { label: 'Observed instability', value: '80%', note: '4 of 5 launches failed', tone: 'danger' },
    { label: 'Noisiest suite', value: 'Filtering Launch Tests', note: 'most failure-like cases', tone: 'danger' },
  ],
  [TRENDS_SECTION]: [
    { label: 'Launch pass rate', value: '20%', note: '1 passed of 5 demo launches', tone: 'warning' },
    { label: 'Failure streak', value: '4', note: 'launches #1-#4', tone: 'danger' },
    { label: 'Latest launch', value: '#5', note: 'Demo Api Tests passed', tone: 'success' },
  ],
  [DURATION_SECTION]: [
    { label: 'Tracked test cases', value: '8', note: 'seeded Demo Api Tests cases', tone: 'neutral' },
    { label: 'Longest flow', value: 'History table...', note: 'extended permissions scenario', tone: 'warning' },
    { label: 'Fastest case', value: 'First test case', note: 'single-step demo case', tone: 'success' },
  ],
};

export const summaryBreakdownRows = [
  ['Filtering Launch Tests', '2', '1', 'Failed', 'danger'],
  ['Permission tests', '1', '1', 'Failed', 'danger'],
  ['Suite with retries', '1', '0', 'Passed', 'success'],
];

export const sprintRows = [
  ['Demo Api Tests #5', 'Passed', '100%', '0', 'success'],
  ['Demo Api Tests #4', 'Failed', '0%', '1', 'danger'],
  ['Demo Api Tests #3', 'Failed', '0%', '1', 'danger'],
  ['Demo Api Tests #2', 'Failed', '0%', '1', 'danger'],
  ['Demo Api Tests #1', 'Failed', '0%', '1', 'danger'],
];

export const alertHighlights = [
  {
    title: 'Launch #4 failed',
    description: 'Demo Api Tests entered a 4-launch failure streak',
    time: '11:59 seeded demo launch',
    tone: 'danger',
  },
  {
    title: 'Permissions flow repeated',
    description: 'Assign User to Project appears across multiple demo launches',
    time: '11:59 seeded demo launch',
    tone: 'warning',
  },
];

export const releases = [
  {
    title: 'Demo Api Tests',
    meta: 'Seeded launch history for superadmin_personal, 5 launches',
    rate: '20%',
    state: 'Latest run passed',
    stateTone: 'warning',
    sprints: [
      {
        name: 'Recent demo runs',
        dates: 'Mar 21',
        meta: '5 launches, 8 test cases, 39 steps',
        rate: '20%',
        state: 'Completed',
        tone: 'warning',
        launches: [
          ['Demo Api Tests #5', 'Seeded launch', 'Passed', '8', '0', 'seeded', '11:59 Mar 21', 'success'],
          ['Demo Api Tests #4', 'Seeded launch', 'Failed', '7', '1', 'seeded', '11:59 Mar 21', 'danger'],
          ['Demo Api Tests #3', 'Seeded launch', 'Failed', '7', '1', 'seeded', '11:59 Mar 21', 'danger'],
          ['Demo Api Tests #2', 'Seeded launch', 'Failed', '7', '1', 'seeded', '11:59 Mar 21', 'danger'],
          ['Demo Api Tests #1', 'Seeded launch', 'Failed', '7', '1', 'seeded', '11:59 Mar 21', 'danger'],
        ],
      },
    ],
  },
];

export const clusters = [
  {
    name: 'Cluster A',
    count: '4 demo steps',
    title: 'AssertionError in filtering criteria',
    subtitle: 'Filtering Launch Tests suite',
    signature: 'AssertionError: expected filtered launch set in FilteringLaunchGtePassedTest',
    tone: 'danger',
    rows: [
      ['testFilterLaunchGreaterThanEqualsPositive', 'seeded', '0.97', 'Product bug', 'danger'],
      ['testFilterLaunchGreaterThanEqualsZero', 'seeded', '0.94', 'Product bug', 'danger'],
      ['testFilterPositive', 'seeded', '0.92', 'Product bug', 'danger'],
      ['testFilterNegative', 'seeded', '0.90', 'Product bug', 'danger'],
    ],
    more: '+ related filtering cases in Demo Api Tests',
  },
  {
    name: 'Cluster B',
    count: '3 demo steps',
    title: 'Permission assignment mismatch',
    subtitle: 'Assign User to Project flow',
    signature: 'AssertionError: expected project assignment to succeed for Assign User to Project',
    tone: 'warning',
    rows: [
      ['testAssignUserToProject', 'seeded', '0.93', 'System issue', 'warning'],
      ['testAssignUserToProjectByAdmin', 'seeded', '0.91', 'System issue', 'warning'],
      ['testAssignUserToOtherProject', 'seeded', '0.88', 'System issue', 'warning'],
    ],
  },
];

export const novelFailures = [
  ['testFilterSpecialSymbols', 'AssertionError', 'FilteringLaunchInTagsTest', 'To investigate'],
  ['testGetSharedFilters', 'MismatchError', 'BasicFilterSharingTest', 'To investigate'],
  ['testStartRootTestItemWithIncorrectLaunch', 'ValidationError', 'StartTestItemTest', 'To investigate'],
];

export const similarFailures = [
  ['0.97', 'testFilterLaunchGreaterThanEqualsZero', 'Demo Api Tests #3', 'DEMO-4421', 'Fixed'],
  ['0.91', 'testFilterPositive', 'Demo Api Tests #2', '', 'Open'],
  ['0.88', 'testAssignUserToProjectByAdmin', 'Demo Api Tests #4', 'DEMO-4310', 'Fixed'],
  ['0.81', 'testFilterLaunchGreaterThanEqualsPositive', 'Demo Api Tests #1', 'DEMO-4290', 'Fixed'],
  ['0.76', 'testAssignUserToProject', 'Demo Api Tests #2', 'DEMO-4188', 'Fixed'],
];

export const analysisPipeline = [
  ['Input', 'Seeded demo launches', '5 launches'],
  ['Step 1', 'Log parser', 'exception and root line'],
  ['Step 2', 'MiniLM embed', '384-dim vector'],
  ['Step 3', 'FAISS search', 'nearest-neighbour'],
  ['Step 4', 'HDBSCAN', 'cluster by proximity'],
  ['Output', 'Labelled groups', '2 clusters and 3 novel demo cases'],
];

export const defectBreakdown = [
  ['Product bug', '4', 50, 'danger'],
  ['System issue', '2', 25, 'warning'],
  ['Automation bug', '1', 12, 'info'],
  ['To investigate', '1', 13, 'neutral'],
];

export const analysisRows = [
  ['testFilterLaunchGreaterThanEqualsPositive', 'A', 'Product bug', '0.97', 'danger'],
  ['testFilterPositive', 'A', 'Product bug', '0.94', 'danger'],
  ['testAssignUserToProject', 'B', 'System issue', '0.91', 'warning'],
  ['testGetSharedFilters', '-', 'To investigate', 'novel', 'neutral'],
  ['testStartRootTestItemWithIncorrectLaunch', '-', 'To investigate', 'novel', 'neutral'],
];

export const flakyTests = [
  ['testFilterLaunchGreaterThanEqualsPositive', '60%', '3/5', 'worsening', [20, 40, 60, 80, 60], 'Launch #4', 'danger'],
  ['testAssignUserToProject', '40%', '2/5', 'stable', [40, 20, 40, 20, 40], 'Launch #3', 'warning'],
  ['testGetSharedFilters', '20%', '1/5', 'improving', [60, 40, 20, 20, 20], 'Launch #2', 'info'],
  ['testStartComplexTestItem', '20%', '1/5', 'stable', [20, 20, 40, 20, 20], 'Launch #1', 'info'],
];

export const durationRows = [
  ['History table. Extended functionality. Permissions. Edit defect', '14.2s', '11.0s', '+29%', 84, 'danger'],
  ['FilteringLaunchGtePassedTest', '9.4s', '7.8s', '+21%', 64, 'warning'],
  ['Assign User to Project', '6.1s', '5.5s', '+11%', 32, 'warning'],
  ['First test case', '1.1s', '1.0s', '+1%', 3, 'neutral'],
  ['StartTestItemTest', '4.3s', '4.9s', '-12%', 12, 'success'],
  ['BasicFilterSharingTest', '3.9s', '4.4s', '-11%', 11, 'success'],
];

export const searchResults = [
  ['0.97', 'AssertionError: expected filtered launch set', 'testFilterLaunchGreaterThanEqualsPositive, Demo Api Tests #4', 'DEMO-4421', 'Fixed', '@demo-admin'],
  ['0.93', 'AssertionError: expected filter result set', 'testFilterPositive, Demo Api Tests #3', 'DEMO-4398', 'Fixed', '@demo-admin'],
  ['0.88', 'PermissionError: assignment mismatch', 'testAssignUserToProject, Demo Api Tests #2', '', 'Open', ''],
  ['0.74', 'MismatchError: shared filter list differs', 'testGetSharedFilters, Demo Api Tests #1', 'DEMO-4310', 'Fixed', '@demo-admin'],
  ['0.68', 'ValidationError: launch reference is incorrect', 'testStartRootTestItemWithIncorrectLaunch, Demo Api Tests #2', 'DEMO-4244', 'Fixed', '@demo-admin'],
];

export const searchHowItWorks = [
  ['BM25', 'Exact match on error codes and class names', 70, 'warning'],
  ['FAISS semantic', 'Finds similar error meaning', 85, 'info'],
  ['RRF merge', 'Combines both without weight tuning', 100, 'success'],
];

export const alertRules = [
  ['Demo launch failed', 'launch status = FAILED', 'Fired for launches #1-#4', true, ['qa-alerts']],
  ['Novel demo case', 'novel case count > 0', 'Fired for 3 demo cases', true, ['qa-alerts']],
  ['Repeated filter mismatch', 'same filter case fails twice', 'Never fired', false, ['team@co.com']],
  ['Long permissions flow', 'history table scenario duration > 10s', 'Fired Mar 21', true, ['qa-perf']],
];

export const alertHistory = [
  ['Demo launch failed', '#4', 'FAILED', 'qa-alerts', '11:59 Mar 21'],
  ['Novel demo case', '#4', '3 cases', 'qa-alerts', '11:59 Mar 21'],
  ['Demo launch failed', '#3', 'FAILED', 'qa-alerts', '11:59 Mar 21'],
  ['Long permissions flow', '#4', '14.2s', 'qa-perf', '11:59 Mar 21'],
];

export const shareLinks = [
  ['Demo Api Tests summary', 'Live', 'Never', '5', 'https://reportportal.io/share/demo-api-tests-summary'],
  ['superadmin_personal launch history', 'Expires Mar 28', 'Mar 28', '8', 'https://reportportal.io/share/demo-api-tests-history'],
];

export const summaryTrend = [0, 0, 0, 0, 100];
export const flakinessTrend = [20, 40, 60, 80, 60];
export const passRateTrend = [0, 0, 0, 0, 100];
export const failureCountTrend = [1, 1, 1, 1, 0];
export const shareViewsTrend = [1, 2, 4, 3, 5];
export const searchBreakdown = [
  ['AssertionError', 3, 'danger'],
  ['PermissionError', 1, 'warning'],
  ['ValidationError', 1, 'info'],
  ['Other', 1, 'neutral'],
];

const superadminSummaryDashboard = {
  tiles: [
    { label: 'Pass rate', value: '20%', note: '↓ only launch #5 passed', tone: 'danger', bar: 20 },
    { label: 'Total failures', value: '4', note: '+4 launches since seeding', tone: 'danger', bar: 80 },
    { label: 'Flaky tests', value: '5', note: '80% instability rate', tone: 'warning', bar: 60 },
    { label: 'ML clusters', value: '2', note: '2 known · 3 novel', tone: 'info', bar: 40 },
    { label: 'Alerts fired', value: '2', note: 'launch failed + novel', tone: 'warning', bar: 30 },
  ],
  qualityHealth: { passRate: 20, flakinessRate: 80, failureRate: 80 },
  activeSprint: {
    name: 'Sprint 34',
    version: 'v2.4.0',
    progress: 71,
    dates: 'Mar 15–21',
    dayLabel: 'day 5 of 7',
    stats: [
      ['Launches run', '5'],
      ['Avg pass rate', '20%'],
      ['Total failures', '4'],
      ['Novel clusters', '3'],
    ],
    trendValues: [0, 0, 0, 0, 100],
    trendLabels: ['#1', '#2', '#3', '#4', '#5'],
  },
  passRateAvg: '20% avg',
  trendLabels: ['D1', 'D2', 'D3', 'D4', 'D5'],
};

const superadminProjectData = {
  metricCards,
  summaryDashboard: superadminSummaryDashboard,
  summaryBreakdownRows,
  sprintRows,
  alertHighlights,
  releases,
  clusters,
  novelFailures,
  similarFailures,
  analysisPipeline,
  defectBreakdown,
  analysisRows,
  flakyTests,
  durationRows,
  searchResults,
  searchHowItWorks,
  alertRules,
  alertHistory,
  shareLinks,
  summaryTrend,
  flakinessTrend,
  passRateTrend,
  failureCountTrend,
  shareViewsTrend,
  searchBreakdown,
  failureCardPresets: [
    {
      title: 'FilteringLaunchGtePassedTest::testFilterLaunchGreaterThanEqualsPositive',
      launch: 'Demo Api Tests #4',
      duration: 'seeded execution',
      summary: 'AssertionError: expected filtered launch set',
      location: 'at testFilterLaunchGreaterThanEqualsPositive in Filtering Launch Tests',
      expected: 'matching launch list',
      actual: 'empty result',
      rawLog: [
        'Loaded launch filter: greater than equals',
        'Expected at least one launch in the filtered result',
        'Actual result size was 0',
      ],
    },
    {
      title: 'Assign User to Project::testAssignUserToProject',
      launch: 'Demo Api Tests #2',
      duration: 'seeded execution',
      summary: 'AssertionError: expected project assignment to succeed',
      location: 'at testAssignUserToProject in Permission tests',
      expected: 'project membership created',
      actual: 'permission mismatch',
      rawLog: [
        'Resolved target user and target project',
        'Assignment request returned a mismatched role state',
        'UI state remained unchanged after assignment attempt',
      ],
    },
  ],
  testLaunchMap: {
    testFilterLaunchGreaterThanEqualsPositive: 'Demo Api Tests #4',
    testFilterLaunchGreaterThanEqualsZero: 'Demo Api Tests #3',
    testFilterPositive: 'Demo Api Tests #3',
    testFilterNegative: 'Demo Api Tests #1',
    testAssignUserToProject: 'Demo Api Tests #2',
    testAssignUserToProjectByAdmin: 'Demo Api Tests #4',
    testAssignUserToOtherProject: 'Demo Api Tests #2',
    testFilterSpecialSymbols: 'Demo Api Tests #5',
    testGetSharedFilters: 'Demo Api Tests #1',
    testStartRootTestItemWithIncorrectLaunch: 'Demo Api Tests #2',
    testStartComplexTestItem: 'Demo Api Tests #1',
    FilteringLaunchGtePassedTest: 'Demo Api Tests #4',
    'Assign User to Project': 'Demo Api Tests #2',
    'First test case': 'Demo Api Tests #5',
    StartTestItemTest: 'Demo Api Tests #2',
    BasicFilterSharingTest: 'Demo Api Tests #1',
    'History table. Extended functionality. Permissions. Edit defect': 'Demo Api Tests #4',
  },
  defaultSearchTerm: 'filter',
  shareDashboards: ['Demo Api Tests summary', 'Flakiness report', 'Pass rate trends'],
};

const defaultPersonalSummaryDashboard = {
  tiles: [
    { label: 'Pass rate', value: '67%', note: '↑ 2 of 3 passed', tone: 'success', bar: 67 },
    { label: 'Total failures', value: '1', note: 'only launch #1 failed', tone: 'warning', bar: 33 },
    { label: 'Flaky tests', value: '3', note: '33% instability rate', tone: 'warning', bar: 33 },
    { label: 'ML clusters', value: '2', note: '2 known · 1 novel', tone: 'info', bar: 40 },
    { label: 'Alerts fired', value: '2', note: 'failed + slow profile', tone: 'warning', bar: 30 },
  ],
  qualityHealth: { passRate: 67, flakinessRate: 33, failureRate: 33 },
  activeSprint: {
    name: 'Sprint 34',
    version: 'v2.4.0',
    progress: 71,
    dates: 'Mar 15–21',
    dayLabel: 'day 5 of 7',
    stats: [
      ['Launches run', '3'],
      ['Avg pass rate', '67%'],
      ['Total failures', '1'],
      ['Novel clusters', '1'],
    ],
    trendValues: [67, 100, 100],
    trendLabels: ['#1', '#2', '#3'],
  },
  passRateAvg: '67% avg',
  trendLabels: ['D1', 'D2', 'D3'],
};

const defaultPersonalProjectData = {
  metricCards: {
    ...metricCards,
    [QUICK_SUMMARY_SECTION]: [
      { label: 'Demo launches', value: '3', note: 'Default Personal Smoke #1-#3', tone: 'info' },
      { label: 'Failed launches', value: '1', note: 'only #1 failed', tone: 'warning' },
      { label: 'Passed launches', value: '2', note: 'latest two runs passed', tone: 'success' },
      { label: 'Demo test cases', value: '6', note: '24 demo steps across 3 suites', tone: 'neutral' },
    ],
    [CLUSTER_VIEW_SECTION]: [
      { label: 'Failed launches', value: '1' },
      { label: 'Clusters formed', value: '2', note: 'grouped from Default Personal Smoke failures' },
      { label: 'Novel cases', value: '1', note: 'one unclustered failure remained', tone: 'warning' },
    ],
    [ML_ANALYSER_SECTION]: [
      { label: 'Launches analysed', value: '3' },
      { label: 'Known demo tests', value: '6', note: 'from Default Personal Smoke' },
      { label: 'Cluster split', value: '2 + 1', note: '2 repeated groups and 1 novel case' },
    ],
    [FLAKINESS_SECTION]: [
      { label: 'Repeated demo tests', value: '3', note: 'same names across smoke runs', tone: 'warning' },
      { label: 'Observed instability', value: '33%', note: '1 of 3 launches failed', tone: 'warning' },
      { label: 'Noisiest suite', value: 'Login Smoke', note: 'login retry path is the noisiest', tone: 'danger' },
    ],
    [TRENDS_SECTION]: [
      { label: 'Launch pass rate', value: '67%', note: '2 passed of 3 demo launches', tone: 'success' },
      { label: 'Failure streak', value: '0', note: 'latest run recovered', tone: 'success' },
      { label: 'Latest launch', value: '#3', note: 'Default Personal Smoke passed', tone: 'success' },
    ],
    [DURATION_SECTION]: [
      { label: 'Tracked test cases', value: '6', note: 'seeded smoke cases', tone: 'neutral' },
      { label: 'Longest flow', value: 'Update profile smoke', note: 'UI save plus verification', tone: 'warning' },
      { label: 'Fastest case', value: 'Open login page', note: 'single navigation step', tone: 'success' },
    ],
  },
  summaryDashboard: defaultPersonalSummaryDashboard,
  summaryBreakdownRows: [
    ['Login Smoke', '2', '0', 'Passed', 'success'],
    ['Profile Smoke', '1', '0', 'Passed', 'success'],
    ['Notification Smoke', '1', '1', 'Failed', 'warning'],
  ],
  sprintRows: [
    ['Default Personal Smoke #3', 'Passed', '100%', '0', 'success'],
    ['Default Personal Smoke #2', 'Passed', '100%', '0', 'success'],
    ['Default Personal Smoke #1', 'Failed', '67%', '1', 'warning'],
  ],
  alertHighlights: [
    {
      title: 'Launch #3 recovered',
      description: 'Default Personal Smoke returned to a fully green state',
      time: '12:14 seeded demo launch',
      tone: 'success',
    },
    {
      title: 'Notification retry stayed flaky',
      description: 'The same notification scenario still flips between pass and fail',
      time: '12:14 seeded demo launch',
      tone: 'warning',
    },
  ],
  releases: [
    {
      title: 'Default Personal Smoke',
      meta: 'Seeded launch history for default_personal, 3 launches',
      rate: '67%',
      state: 'Latest run passed',
      stateTone: 'success',
      sprints: [
        {
          name: 'Recent smoke runs',
          dates: 'Mar 21',
          meta: '3 launches, 6 test cases, 24 steps',
          rate: '67%',
          state: 'Completed',
          tone: 'success',
          launches: [
            ['Default Personal Smoke #3', 'Seeded launch', 'Passed', '6', '0', 'seeded', '12:14 Mar 21', 'success'],
            ['Default Personal Smoke #2', 'Seeded launch', 'Passed', '6', '0', 'seeded', '12:10 Mar 21', 'success'],
            ['Default Personal Smoke #1', 'Seeded launch', 'Failed', '4', '1', 'seeded', '12:05 Mar 21', 'warning'],
          ],
        },
      ],
    },
  ],
  clusters: [
    {
      name: 'Cluster A',
      count: '2 smoke tests',
      title: 'AssertionError in login redirect validation',
      subtitle: 'Login Smoke suite',
      signature: 'AssertionError: expected dashboard redirect after login submit',
      tone: 'warning',
      rows: [
        ['testLoginRedirectAfterSubmit', 'seeded', '0.95', 'System issue', 'warning'],
        ['testLoginRememberMeRedirect', 'seeded', '0.91', 'System issue', 'warning'],
      ],
      more: '+ related login checks in Default Personal Smoke',
    },
    {
      name: 'Cluster B',
      count: '2 smoke tests',
      title: 'Profile update toast mismatch',
      subtitle: 'Profile Smoke suite',
      signature: 'AssertionError: expected success toast after profile save',
      tone: 'danger',
      rows: [
        ['testUpdateProfileToast', 'seeded', '0.94', 'Product bug', 'danger'],
        ['testUpdateProfileAvatar', 'seeded', '0.89', 'Product bug', 'danger'],
      ],
    },
  ],
  novelFailures: [
    ['testNotificationRetryBanner', 'AssertionError', 'NotificationRetryTest', 'To investigate'],
  ],
  similarFailures: [
    ['0.96', 'testLoginRedirectAfterSubmit', 'Default Personal Smoke #1', 'DEMO-5101', 'Open'],
    ['0.90', 'testUpdateProfileToast', 'Default Personal Smoke #1', 'DEMO-5098', 'Fixed'],
    ['0.84', 'testUpdateProfileAvatar', 'Default Personal Smoke #2', 'DEMO-5097', 'Fixed'],
  ],
  analysisPipeline,
  defectBreakdown: [
    ['Product bug', '2', 40, 'danger'],
    ['System issue', '2', 40, 'warning'],
    ['To investigate', '1', 20, 'neutral'],
  ],
  analysisRows: [
    ['testLoginRedirectAfterSubmit', 'A', 'System issue', '0.95', 'warning'],
    ['testLoginRememberMeRedirect', 'A', 'System issue', '0.91', 'warning'],
    ['testUpdateProfileToast', 'B', 'Product bug', '0.94', 'danger'],
    ['testUpdateProfileAvatar', 'B', 'Product bug', '0.89', 'danger'],
    ['testNotificationRetryBanner', '-', 'To investigate', 'novel', 'neutral'],
  ],
  flakyTests: [
    ['testNotificationRetryBanner', '33%', '1/3', 'stable', [0, 33, 33], 'Launch #1', 'warning'],
    ['testLoginRedirectAfterSubmit', '33%', '1/3', 'improving', [33, 33, 0], 'Launch #1', 'warning'],
    ['testUpdateProfileToast', '0%', '0/3', 'stable', [0, 0, 0], 'Never', 'success'],
  ],
  durationRows: [
    ['Update profile smoke', '7.4s', '5.2s', '+42%', 82, 'danger'],
    ['NotificationRetryTest', '4.8s', '4.1s', '+17%', 41, 'warning'],
    ['Login redirect smoke', '2.1s', '2.0s', '+5%', 12, 'neutral'],
    ['Open login page', '0.8s', '0.8s', '0%', 4, 'success'],
  ],
  searchResults: [
    ['0.96', 'AssertionError: expected dashboard redirect after login submit', 'testLoginRedirectAfterSubmit, Default Personal Smoke #1', 'DEMO-5101', 'Open', '@default-owner'],
    ['0.91', 'AssertionError: expected success toast after profile save', 'testUpdateProfileToast, Default Personal Smoke #1', 'DEMO-5098', 'Fixed', '@default-owner'],
    ['0.82', 'AssertionError: expected notification retry banner', 'testNotificationRetryBanner, Default Personal Smoke #2', '', 'Open', ''],
  ],
  searchHowItWorks,
  alertRules: [
    ['Smoke launch failed', 'launch status = FAILED', 'Fired for launch #1', true, ['default-alerts']],
    ['Notification retry unstable', 'same notification test fails once in 3 runs', 'Fired for launch #2', true, ['default-alerts']],
    ['Profile update slow', 'profile save duration > 7s', 'Fired Mar 21', true, ['default-perf']],
  ],
  alertHistory: [
    ['Smoke launch failed', '#1', 'FAILED', 'default-alerts', '12:05 Mar 21'],
    ['Profile update slow', '#3', '7.4s', 'default-perf', '12:14 Mar 21'],
  ],
  shareLinks: [
    ['Default Personal Smoke summary', 'Live', 'Never', '3', 'https://reportportal.io/share/default-personal-summary'],
    ['default_personal launch history', 'Expires Mar 28', 'Mar 28', '2', 'https://reportportal.io/share/default-personal-history'],
  ],
  summaryTrend: [33, 66, 100],
  flakinessTrend: [33, 33, 0],
  passRateTrend: [67, 100, 100],
  failureCountTrend: [1, 0, 0],
  shareViewsTrend: [0, 1, 2, 2, 3],
  searchBreakdown: [
    ['AssertionError', 2, 'warning'],
    ['System issue', 1, 'info'],
    ['Other', 1, 'neutral'],
  ],
  failureCardPresets: [
    {
      title: 'LoginSmoke::testLoginRedirectAfterSubmit',
      launch: 'Default Personal Smoke #1',
      duration: 'seeded execution',
      summary: 'AssertionError: expected dashboard redirect after login submit',
      location: 'at testLoginRedirectAfterSubmit in Login Smoke',
      expected: 'dashboard redirect',
      actual: 'login page stayed visible',
      rawLog: [
        'Loaded login page',
        'Submitted credentials for default_personal',
        'Redirect target stayed on /login instead of /dashboard',
      ],
    },
    {
      title: 'ProfileSmoke::testUpdateProfileToast',
      launch: 'Default Personal Smoke #1',
      duration: 'seeded execution',
      summary: 'AssertionError: expected success toast after profile save',
      location: 'at testUpdateProfileToast in Profile Smoke',
      expected: 'success toast displayed',
      actual: 'toast text mismatched',
      rawLog: [
        'Opened profile form',
        'Submitted valid profile update payload',
        'Toast rendered with warning copy instead of success copy',
      ],
    },
  ],
  testLaunchMap: {
    testLoginRedirectAfterSubmit: 'Default Personal Smoke #1',
    testLoginRememberMeRedirect: 'Default Personal Smoke #1',
    testUpdateProfileToast: 'Default Personal Smoke #1',
    testUpdateProfileAvatar: 'Default Personal Smoke #2',
    testNotificationRetryBanner: 'Default Personal Smoke #2',
    'Update profile smoke': 'Default Personal Smoke #3',
    NotificationRetryTest: 'Default Personal Smoke #2',
    'Login redirect smoke': 'Default Personal Smoke #1',
    'Open login page': 'Default Personal Smoke #3',
  },
  defaultSearchTerm: 'login',
  shareDashboards: ['Default Personal Smoke summary', 'Flakiness report', 'Pass rate trends'],
};

export const projectInsightsData = {
  superadmin_personal: superadminProjectData,
  default_personal: defaultPersonalProjectData,
};

export const getProjectInsightsData = (projectId) =>
  projectInsightsData[projectId] || superadminProjectData;
