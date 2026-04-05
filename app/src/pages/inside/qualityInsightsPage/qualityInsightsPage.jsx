import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import {
  payloadSelector,
  projectIdSelector,
} from 'controllers/pages';
import { assignedProjectsSelector } from 'controllers/user';
import styles from './qualityInsightsPage.scss';
import { Badge } from './components/ui';
import SummaryPage from './components/SummaryPage';
import ReleasesPage from './components/ReleasesPage';
import ClusterViewPage from './components/ClusterViewPage';
import FailureCardPage from './components/FailureCardPage';
import MlAnalyserPage from './components/MlAnalyserPage';
import FlakinessPage from './components/FlakinessPage';
import TrendsPage from './components/TrendsPage';
import DurationPage from './components/DurationPage';
import FailureSearchPage from './components/FailureSearchPage';
import AlertsPage from './components/AlertsPage';
import {
  ALERTS_SECTION,
  CLUSTER_VIEW_SECTION,
  DEFAULT_QUALITY_INSIGHTS_SECTION,
  DURATION_SECTION,
  FAILURE_CARD_SECTION,
  FAILURE_SEARCH_SECTION,
  FLAKINESS_SECTION,
  ML_ANALYSER_SECTION,
  QUALITY_INSIGHTS_SECTIONS,
  QUICK_SUMMARY_SECTION,
  RELEASES_SECTION,
  TRENDS_SECTION,
} from './constants';
import { sectionTitles } from './mockData';
import { fetchLaunchData, transformLaunchesToInsightsData } from './dataService';

const cx = classNames.bind(styles);

const parsePercent = (value) => Number(String(value).replace('%', '')) || 0;
const parseSignedPercent = (value) => Number(String(value).replace('%', '')) || 0;
const filterByWindow = (values, windowLabel) =>
  windowLabel === 'Last 7 days' ? values.slice(-7) : values;
const getSearchQueryLabel = (value) => value.trim().toLowerCase();
const SUMMARY_FILTER_ALL = '__all__';
const SUMMARY_DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];
const RESERVED_SUMMARY_ATTRIBUTE_KEYS = new Set(['build', 'env', 'environment', 'release', 'sprint']);

const getLaunchStartTimestamp = (launch) => {
  const timestamp = launch?.startTime ? new Date(launch.startTime).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortLaunchesByStartTime = (launches) =>
  [...(launches || [])].sort((left, right) => getLaunchStartTimestamp(right) - getLaunchStartTimestamp(left));

const getLaunchLabel = (launch) => {
  if (!launch) {
    return '';
  }

  const launchName = String(launch.name || 'Launch').trim() || 'Launch';
  return launch.number === undefined || launch.number === null
    ? launchName
    : `${launchName} #${launch.number}`;
};

const getLaunchName = (launch) => String(launch?.name || '').trim();

const getLaunchNumber = (launch) =>
  launch?.number === undefined || launch?.number === null ? '' : String(launch.number);

const getLaunchAttributes = (launch) => (Array.isArray(launch?.attributes) ? launch.attributes : []);

const getLaunchAttributeValue = (launch, keys) => {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const attribute = getLaunchAttributes(launch).find((item) => {
    const attributeKey = String(item?.key || '').trim().toLowerCase();
    const attributeValue = String(item?.value || '').trim();
    return keySet.has(attributeKey) && attributeValue;
  });

  return String(attribute?.value || '').trim();
};

const getLaunchEnvironment = (launch) =>
  getLaunchAttributeValue(launch, ['env', 'environment']) || 'Unspecified';

const getLaunchTags = (launch) =>
  Array.from(
    new Set(
      getLaunchAttributes(launch)
        .filter((attribute) => {
          const key = String(attribute?.key || '').trim().toLowerCase();
          const value = String(attribute?.value || '').trim();
          return value && !RESERVED_SUMMARY_ATTRIBUTE_KEYS.has(key);
        })
        .map((attribute) => String(attribute.value).trim()),
    ),
  );

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
    const matchesEnvironment =
      filters.environment === SUMMARY_FILTER_ALL ||
      getLaunchEnvironment(launch) === filters.environment;
    const launchTags = getLaunchTags(launch);
    const matchesTag =
      filters.tag === SUMMARY_FILTER_ALL ||
      launchTags.includes(filters.tag);

    return matchesDateRange && matchesEnvironment && matchesTag;
  });
};

const buildSummaryScope = (launches, filters) => {
  const windowLaunches = buildScopedLaunchWindow(launches, filters);
  const launchNameScopedLaunches = filters.launchName === SUMMARY_FILTER_ALL
    ? windowLaunches
    : windowLaunches.filter((launch) => getLaunchName(launch) === filters.launchName);
  const selectedLaunch = filters.launchNumber !== SUMMARY_FILTER_ALL
    ? launchNameScopedLaunches.find((launch) => getLaunchNumber(launch) === String(filters.launchNumber)) || launchNameScopedLaunches[0] || null
    : launchNameScopedLaunches[0] || null;
  const selectedIndex = selectedLaunch
    ? launchNameScopedLaunches.findIndex((launch) => String(launch.id) === String(selectedLaunch.id))
    : -1;
  const previousLaunch = selectedIndex >= 0 ? launchNameScopedLaunches[selectedIndex + 1] || null : null;
  const contextLaunches = selectedIndex >= 0
    ? launchNameScopedLaunches.slice(selectedIndex, selectedIndex + 6)
    : launchNameScopedLaunches.slice(0, 6);

  return {
    windowLaunches,
    launchNameScopedLaunches,
    selectedLaunch,
    previousLaunch,
    contextLaunches,
  };
};

const buildSummaryFilterOptions = (launches, filters) => {
  const orderedLaunches = sortLaunchesByStartTime(launches);
  const scopedLaunches = buildScopedLaunchWindow(orderedLaunches, filters);
  const launchNameOptions = Array.from(
    new Set(scopedLaunches.map((launch) => getLaunchName(launch)).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const launchNumberSource = filters.launchName === SUMMARY_FILTER_ALL
    ? scopedLaunches
    : scopedLaunches.filter((launch) => getLaunchName(launch) === filters.launchName);
  const launchNumberOptions = Array.from(
    new Set(launchNumberSource.map((launch) => getLaunchNumber(launch)).filter(Boolean)),
  ).sort((left, right) => Number(right) - Number(left));
  const tagOptions = Array.from(
    new Set(orderedLaunches.flatMap((launch) => getLaunchTags(launch))),
  ).sort((left, right) => left.localeCompare(right));
  const environmentOptions = Array.from(
    new Set(orderedLaunches.map((launch) => getLaunchEnvironment(launch)).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

  return {
    dateRange: SUMMARY_DATE_RANGE_OPTIONS,
    launchName: [
      { value: SUMMARY_FILTER_ALL, label: 'All launch names' },
      ...launchNameOptions.map((launchName) => ({ value: launchName, label: launchName })),
    ],
    launchNumber: [
      { value: SUMMARY_FILTER_ALL, label: 'Latest matching launch number' },
      ...launchNumberOptions.map((launchNumber) => ({ value: launchNumber, label: `#${launchNumber}` })),
    ],
    tag: [
      { value: SUMMARY_FILTER_ALL, label: 'All tags' },
      ...tagOptions.map((tag) => ({ value: tag, label: tag })),
    ],
    environment: [
      { value: SUMMARY_FILTER_ALL, label: 'All environments' },
      ...environmentOptions.map((environment) => ({ value: environment, label: environment })),
    ],
  };
};






const dedupeSearchResults = (results) => {
  const seen = new Set();

  return results.filter((result) => {
    const key = result.map((value) => String(value || '').trim().toLowerCase()).join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};


const buildInitialState = () => ({
  selectedLaunchName: '',
  expandedReleaseKeys: [],
  summaryFilters: {
    dateRange: '30',
    launchName: SUMMARY_FILTER_ALL,
    launchNumber: SUMMARY_FILTER_ALL,
    tag: SUMMARY_FILTER_ALL,
    environment: SUMMARY_FILTER_ALL,
  },
  selectedClusterIndex: 0,
  selectedNovelIndex: 0,
  selectedDefectType: 'Product bug',
  showRawLog: false,
  analysisCategory: 'all',
  flakinessWindow: 'Last 30 days',
  flakinessMinimum: 'Min: 5%',
  exportMessage: '',
  trendsWindow: 'Last 30 days',
  trendsGranularity: 'Granularity: day',
  trendsComparePrevious: false,
  durationWindow: 'Last 30 days',
  durationThreshold: 'Flag: >20% increase',
  searchTerm: '',
  searchProject: 'All projects',
  selectedSearchResultIndex: 0,
  alertRuleState: [],
  digestState: {
    schedule: 'Daily',
    time: '08:00',
    savedMessage: '',
    topics: {
      passRate: true,
      flakyTests: true,
      newFailures: true,
      duration: false,
    },
  },
  shareLinksState: [],
  shareDraft: {
    dashboard: 'Quality insights summary',
    expires: 'Never',
    access: 'Read-only',
  },
  shareFeedback: '',
  insightsData: null,
  insightsLoading: true,
  insightsError: null,
});


const renderSection = (section, projectId, interactions) => {
  switch (section) {
    case QUICK_SUMMARY_SECTION:
      return <SummaryPage projectId={projectId} {...interactions.summary} />;
    case RELEASES_SECTION:
      return <ReleasesPage projectId={projectId} {...interactions.releases} />;
    case CLUSTER_VIEW_SECTION:
      return <ClusterViewPage projectId={projectId} {...interactions.clusterView} />;
    case FAILURE_CARD_SECTION:
      return <FailureCardPage projectId={projectId} {...interactions.failureCard} />;
    case ML_ANALYSER_SECTION:
      return <MlAnalyserPage projectId={projectId} {...interactions.mlAnalyser} />;
    case FLAKINESS_SECTION:
      return <FlakinessPage projectId={projectId} {...interactions.flakiness} />;
    case TRENDS_SECTION:
      return <TrendsPage projectId={projectId} {...interactions.trends} />;
    case DURATION_SECTION:
      return <DurationPage projectId={projectId} {...interactions.duration} />;
    case FAILURE_SEARCH_SECTION:
      return <FailureSearchPage projectId={projectId} {...interactions.failureSearch} />;
    case ALERTS_SECTION:
      return <AlertsPage {...interactions.alerts} />;
    default:
      return <SummaryPage projectId={projectId} {...interactions.summary} />;
  }
};

@connect((state) => {
  const payload = payloadSelector(state);
  const activeSection = QUALITY_INSIGHTS_SECTIONS.includes(payload.insightSection)
    ? payload.insightSection
    : DEFAULT_QUALITY_INSIGHTS_SECTION;

  return {
    activeSection,
    projectId: projectIdSelector(state),
    assignedProjects: Object.keys(assignedProjectsSelector(state) || {}),
  };
})
export class QualityInsightsPage extends React.Component {
  static propTypes = {
    activeSection: PropTypes.string,
    projectId: PropTypes.string,
    assignedProjects: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    activeSection: DEFAULT_QUALITY_INSIGHTS_SECTION,
    projectId: '',
    assignedProjects: [],
  };

  constructor(props) {
    super(props);

    this.state = buildInitialState();
  }

  componentDidMount() {
    this.loadData(this.props.projectId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.projectId !== this.props.projectId) {
      this.setState(buildInitialState());
      this.loadData(this.props.projectId);
    }
  }

  loadData = async (projectId) => {
    const normalizedProjectId = projectId || this.props.assignedProjects[0] || '';
    if (!normalizedProjectId) {
      this.setState({ insightsLoading: false, insightsError: 'No project selected.' });
      return;
    }
    try {
      this.setState({ insightsLoading: true, insightsError: null });
      const launches = await fetchLaunchData(normalizedProjectId);
      const insightsData = transformLaunchesToInsightsData(launches, normalizedProjectId);
      this.setState({
        insightsData,
        insightsLoading: false,
        selectedLaunchName: insightsData.sprintRows?.[0]?.[0] || '',
        expandedReleaseKeys: [],
      });
    } catch (error) {
      this.setState({
        insightsLoading: false,
        insightsError: error?.message || String(error),
      });
    }
  };

  setSelectedLaunch = (selectedLaunchName) => {
    this.setState({ selectedLaunchName });
  };

  updateSummaryFilter = (key) => (event) => {
    const nextValue = event.target.value;

    this.setState((prevState) => {
      const nextFilters = {
        ...prevState.summaryFilters,
        [key]: nextValue,
      };

      const windowLaunches = buildScopedLaunchWindow(prevState.insightsData?.launches, nextFilters);
      const availableLaunchNames = new Set(windowLaunches.map((launch) => getLaunchName(launch)).filter(Boolean));

      if (nextFilters.launchName !== SUMMARY_FILTER_ALL && !availableLaunchNames.has(nextFilters.launchName)) {
        nextFilters.launchName = SUMMARY_FILTER_ALL;
      }

      const numberScopedLaunches = nextFilters.launchName === SUMMARY_FILTER_ALL
        ? windowLaunches
        : windowLaunches.filter((launch) => getLaunchName(launch) === nextFilters.launchName);
      const availableLaunchNumbers = new Set(numberScopedLaunches.map((launch) => getLaunchNumber(launch)).filter(Boolean));

      if (nextFilters.launchNumber !== SUMMARY_FILTER_ALL && !availableLaunchNumbers.has(String(nextFilters.launchNumber))) {
        nextFilters.launchNumber = SUMMARY_FILTER_ALL;
      }

      return {
        summaryFilters: nextFilters,
      };
    });
  };

  toggleRelease = (releaseKey) => {
    this.setState((prevState) => ({
      expandedReleaseKeys: prevState.expandedReleaseKeys.includes(releaseKey)
        ? prevState.expandedReleaseKeys.filter((key) => key !== releaseKey)
        : [...prevState.expandedReleaseKeys, releaseKey],
    }));
  };

  setSelectedCluster = (selectedClusterIndex) => {
    this.setState({ selectedClusterIndex, showRawLog: false });
  };

  setSelectedNovelFailure = (selectedNovelIndex) => {
    this.setState({ selectedNovelIndex });
  };

  setSelectedDefectType = (selectedDefectType) => {
    this.setState({ selectedDefectType });
  };

  toggleRawLog = () => {
    this.setState((prevState) => ({ showRawLog: !prevState.showRawLog }));
  };

  setAnalysisCategory = (analysisCategory) => {
    this.setState({ analysisCategory });
  };

  setStateValue = (key) => (value) => {
    this.setState({ [key]: value });
  };

  toggleTrendsComparePrevious = () => {
    this.setState((prevState) => ({
      trendsComparePrevious: !prevState.trendsComparePrevious,
    }));
  };

  exportFlakiness = () => {
    this.setState({ exportMessage: 'CSV export prepared from the current flakiness filter.' });
  };

  setSelectedSearchResult = (selectedSearchResultIndex) => {
    this.setState({ selectedSearchResultIndex });
  };

  toggleAlertRule = (name) => {
    this.setState((prevState) => ({
      alertRuleState: prevState.alertRuleState.map((rule) =>
        rule.name === name ? { ...rule, active: !rule.active } : rule,
      ),
    }));
  };

  updateDigestField = (field, value) => {
    this.setState((prevState) => ({
      digestState: {
        ...prevState.digestState,
        [field]: value,
        savedMessage: '',
      },
    }));
  };

  toggleDigestTopic = (topic) => {
    this.setState((prevState) => ({
      digestState: {
        ...prevState.digestState,
        savedMessage: '',
        topics: {
          ...prevState.digestState.topics,
          [topic]: !prevState.digestState.topics[topic],
        },
      },
    }));
  };

  saveDigest = () => {
    this.setState((prevState) => ({
      digestState: {
        ...prevState.digestState,
        savedMessage: `Digest saved for ${prevState.digestState.schedule.toLowerCase()} delivery at ${prevState.digestState.time}.`,
      },
    }));
  };

  copyShareLink = (url) => {
    this.setState({ shareFeedback: `Copied ${url}` });
  };

  revokeShareLink = (url) => {
    this.setState((prevState) => ({
      shareLinksState: prevState.shareLinksState.filter((link) => link.url !== url),
      shareFeedback: `Revoked ${url}`,
    }));
  };

  updateShareDraft = (field, value) => {
    this.setState((prevState) => ({
      shareDraft: {
        ...prevState.shareDraft,
        [field]: value,
      },
      shareFeedback: '',
    }));
  };

  generateShareLink = () => {
    this.setState((prevState) => ({
      shareLinksState: [
        {
          name: prevState.shareDraft.dashboard,
          state: 'Live',
          expiry: prevState.shareDraft.expires,
          views: '0',
          url: `https://reportportal.io/share/${prevState.shareDraft.dashboard
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}`,
        },
        ...prevState.shareLinksState,
      ],
      shareFeedback: `Generated a ${prevState.shareDraft.access.toLowerCase()} link for ${prevState.shareDraft.dashboard}.`,
    }));
  };

  render() {
    const { activeSection, projectId } = this.props;
    const normalizedProjectId = projectId || this.props.assignedProjects[0] || '';
    const data = this.state.insightsData;

    if (this.state.insightsLoading) {
      return (
        <div className={cx('quality-insights-page')}>
          <div className={cx('shell')}>
            <div className={cx('main')}>
              <div className={cx('content')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#6c7486' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Loading Quality Insights…</div>
                  <div style={{ fontSize: '12px' }}>Fetching launch data for {normalizedProjectId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.insightsError || !data) {
      return (
        <div className={cx('quality-insights-page')}>
          <div className={cx('shell')}>
            <div className={cx('main')}>
              <div className={cx('content')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#d5463d' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Failed to load data</div>
                  <div style={{ fontSize: '12px', color: '#6c7486' }}>{this.state.insightsError || 'No launch data available'}</div>
                  <button className={cx('button', 'button-primary')} style={{ marginTop: '16px' }} onClick={() => this.loadData(normalizedProjectId)}>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const minimumFlakiness =
      this.state.flakinessMinimum === 'Show all'
        ? 0
        : Number(this.state.flakinessMinimum.match(/(\d+)/)?.[0] || 0);
    const filteredFlakyTests = (data.flakyTests || []).filter(
      ([, flaky]) => parsePercent(flaky) >= minimumFlakiness,
    );
    const threshold =
      this.state.durationThreshold === 'Show all'
        ? -Infinity
        : Number(this.state.durationThreshold.match(/(\d+)/)?.[0] || 0);
    const filteredDurationRows = (data.durationRows || []).filter(([, , , delta]) =>
      this.state.durationThreshold === 'Show all' ? true : Math.abs(parseSignedPercent(delta)) >= threshold,
    );
    const displayedPassRateTrend = filterByWindow(data.passRateTrend || [], this.state.trendsWindow);
    const displayedFailureCountTrend = filterByWindow(data.failureCountTrend || [], this.state.trendsWindow);
    const normalizedSearchQuery = getSearchQueryLabel(this.state.searchTerm);
    const filteredSearchResults = dedupeSearchResults((data.searchResults || []).filter(([, title, meta]) => {
      const matchesQuery =
        !normalizedSearchQuery ||
        title.toLowerCase().includes(normalizedSearchQuery) ||
        meta.toLowerCase().includes(normalizedSearchQuery);
      const matchesProject =
        this.state.searchProject === 'All projects' ||
        meta.toLowerCase().includes(this.state.searchProject.toLowerCase()) ||
        normalizedProjectId === this.state.searchProject;
      return matchesQuery && matchesProject;
    }));
    const selectedCluster = (data.clusters || [])[this.state.selectedClusterIndex] || (data.clusters || [])[0] || { signature: 'No clusters', count: 0, firstSeen: '', launches: [], logs: [] };
    const failureCard = (data.failureCardPresets || [])[this.state.selectedClusterIndex] || (data.failureCardPresets || [])[0] || { title: 'No failures', category: 'N/A', launch: '', summary: '', tone: 'neutral' };
    const summaryFilterOptions = buildSummaryFilterOptions(data.launches, this.state.summaryFilters);
    const summaryScope = buildSummaryScope(data.launches, this.state.summaryFilters);
    const summaryScopeLaunch = summaryScope.selectedLaunch ? getLaunchLabel(summaryScope.selectedLaunch) : 'No matching execution';
    const summaryScopeCount = summaryScope.launchNameScopedLaunches.length;
    const summaryScopeMeta = summaryScope.previousLaunch
      ? `${summaryScopeLaunch} compared with ${getLaunchLabel(summaryScope.previousLaunch)}`
      : `${summaryScopeLaunch} · ${summaryScopeCount} matching execution${summaryScopeCount === 1 ? '' : 's'}`;
    const interactions = {
      summary: {
        data,
        scope: summaryScope,
      },
      releases: {
        data,
        expandedReleaseKeys: this.state.expandedReleaseKeys,
        onToggleRelease: this.toggleRelease,
      },
      clusterView: {
        data,
        selectedClusterIndex: this.state.selectedClusterIndex,
        onSelectCluster: this.setSelectedCluster,
        selectedNovelIndex: this.state.selectedNovelIndex,
        onSelectNovelFailure: this.setSelectedNovelFailure,
      },
      failureCard: {
        data,
        failureCard,
        selectedDefectType: this.state.selectedDefectType,
        onSelectDefectType: this.setSelectedDefectType,
        showRawLog: this.state.showRawLog,
        onToggleRawLog: this.toggleRawLog,
      },
      mlAnalyser: {
        data,
        analysisCategory: this.state.analysisCategory,
        onSelectAnalysisCategory: this.setAnalysisCategory,
      },
      flakiness: {
        data,
        flakinessWindow: this.state.flakinessWindow,
        flakinessMinimum: this.state.flakinessMinimum,
        filteredFlakyTests,
        onChangeFlakinessWindow: this.setStateValue('flakinessWindow'),
        onChangeFlakinessMinimum: this.setStateValue('flakinessMinimum'),
        exportMessage: this.state.exportMessage,
        onExportFlakiness: this.exportFlakiness,
      },
      trends: {
        data,
        trendsWindow: this.state.trendsWindow,
        trendsGranularity: this.state.trendsGranularity,
        trendsComparePrevious: this.state.trendsComparePrevious,
        displayedPassRateTrend,
        displayedFailureCountTrend,
        onChangeTrendsWindow: this.setStateValue('trendsWindow'),
        onChangeTrendsGranularity: this.setStateValue('trendsGranularity'),
        onToggleTrendsComparePrevious: this.toggleTrendsComparePrevious,
      },
      duration: {
        data,
        durationWindow: this.state.durationWindow,
        durationThreshold: this.state.durationThreshold,
        filteredDurationRows,
        onChangeDurationWindow: this.setStateValue('durationWindow'),
        onChangeDurationThreshold: this.setStateValue('durationThreshold'),
      },
      failureSearch: {
        data,
        projects: this.props.assignedProjects,
        searchTerm: this.state.searchTerm,
        searchProject: this.state.searchProject,
        filteredSearchResults,
        selectedSearchResultIndex: Math.min(
          this.state.selectedSearchResultIndex,
          Math.max(filteredSearchResults.length - 1, 0),
        ),
        onChangeSearchTerm: this.setStateValue('searchTerm'),
        onChangeSearchProject: this.setStateValue('searchProject'),
        onSelectSearchResult: this.setSelectedSearchResult,
      },
      alerts: {
        alertRuleState: this.state.alertRuleState,
        alertHistory: data.alertHistory,
        digestState: this.state.digestState,
        onToggleAlertRule: this.toggleAlertRule,
        onChangeDigestField: this.updateDigestField,
        onToggleDigestTopic: this.toggleDigestTopic,
        onSaveDigest: this.saveDigest,
      },
    };
    const title = sectionTitles[activeSection] || sectionTitles[DEFAULT_QUALITY_INSIGHTS_SECTION];

    return (
      <div className={cx('quality-insights-page')}>
        <div className={cx('shell')}>
          <div className={cx('main')}>
            <div className={cx('topbar')}>
              <div className={cx('breadcrumb')}>
                {`${normalizedProjectId} / `}
                <strong>{title}</strong>
              </div>
            </div>
            <div className={cx('content')}>
              <div className={cx('page-title-row')}>
                <div className={cx('page-title')}>{title}</div>
                {activeSection === CLUSTER_VIEW_SECTION ? <Badge tone={'neutral'}>HDBSCAN min_cluster_size=2</Badge> : null}
                {activeSection === FAILURE_CARD_SECTION ? <Badge tone={'neutral'}>log_parser.py</Badge> : null}
                {activeSection === ML_ANALYSER_SECTION ? <Badge tone={'neutral'}>MiniLM, HDBSCAN, BM25</Badge> : null}
                {activeSection === FAILURE_SEARCH_SECTION ? <Badge tone={'neutral'}>BM25 plus FAISS</Badge> : null}
              </div>
              {activeSection === QUICK_SUMMARY_SECTION ? (
                <div className={cx('summary-filter-bar')}>
                  <label className={cx('summary-filter-field')}>
                    <span className={cx('summary-filter-label')}>Date range</span>
                    <select className={cx('select', 'summary-filter-select')} value={this.state.summaryFilters.dateRange} onChange={this.updateSummaryFilter('dateRange')}>
                      {summaryFilterOptions.dateRange.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={cx('summary-filter-field')}>
                    <span className={cx('summary-filter-label')}>Launch name</span>
                    <select className={cx('select', 'summary-filter-select')} value={this.state.summaryFilters.launchName} onChange={this.updateSummaryFilter('launchName')}>
                      {summaryFilterOptions.launchName.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={cx('summary-filter-field')}>
                    <span className={cx('summary-filter-label')}>Launch number</span>
                    <select className={cx('select', 'summary-filter-select')} value={this.state.summaryFilters.launchNumber} onChange={this.updateSummaryFilter('launchNumber')}>
                      {summaryFilterOptions.launchNumber.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={cx('summary-filter-field')}>
                    <span className={cx('summary-filter-label')}>Tag</span>
                    <select className={cx('select', 'summary-filter-select')} value={this.state.summaryFilters.tag} onChange={this.updateSummaryFilter('tag')}>
                      {summaryFilterOptions.tag.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={cx('summary-filter-field')}>
                    <span className={cx('summary-filter-label')}>Environment</span>
                    <select className={cx('select', 'summary-filter-select')} value={this.state.summaryFilters.environment} onChange={this.updateSummaryFilter('environment')}>
                      {summaryFilterOptions.environment.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className={cx('summary-filter-meta')}>
                    <div className={cx('summary-filter-kicker')}>Quick Summary scope</div>
                    <div className={cx('summary-filter-copy')}>{summaryScopeMeta}</div>
                  </div>
                </div>
              ) : null}
              {renderSection(activeSection, normalizedProjectId, interactions)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
