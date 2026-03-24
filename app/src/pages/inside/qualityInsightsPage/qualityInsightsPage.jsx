import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import { NavLink } from 'redux-first-router-link';
import {
  payloadSelector,
  projectIdSelector,
  PROJECT_LAUNCHES_PAGE,
  PROJECT_QUALITY_INSIGHTS_PAGE,
  TEST_ITEM_PAGE,
} from 'controllers/pages';
import { assignedProjectsSelector } from 'controllers/user';
import { ALL } from 'common/constants/reservedFilterIds';
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
import { navigationGroups, sectionTitles } from './mockData';
import { fetchLaunchData, transformLaunchesToInsightsData } from './dataService';

const cx = classNames.bind(styles);











const quickLinkMap = [
  [CLUSTER_VIEW_SECTION, 'View failure clusters'],
  [FLAKINESS_SECTION, 'Flakiness report'],
  [FAILURE_SEARCH_SECTION, 'Search failures'],
];

const parsePercent = (value) => Number(String(value).replace('%', '')) || 0;
const parseSignedPercent = (value) => Number(String(value).replace('%', '')) || 0;
const createAlertRuleState = (alertRulesData) =>
  alertRulesData.map(([name, condition, state, active, channels]) => ({
    name,
    condition,
    state,
    active,
    channels,
  }));
const createShareLinksState = (shareLinksData) =>
  shareLinksData.map(([name, state, expiry, views, url]) => ({
    name,
    state,
    expiry,
    views,
    url,
  }));
const filterByWindow = (values, windowLabel) =>
  windowLabel === 'Last 7 days' ? values.slice(-7) : values;
const getSearchQueryLabel = (value) => value.trim().toLowerCase();






const extractLaunchNameFromMeta = (meta) => {
  const [, launchName = ''] = String(meta || '').split(',');
  return launchName.trim();
};


const buildInitialState = () => ({
  selectedLaunchName: '',
  expandedReleaseKeys: [],
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

const getSectionLink = (projectId, insightSection) => ({
  type: PROJECT_QUALITY_INSIGHTS_PAGE,
  payload: {
    projectId,
    insightSection,
  },
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
    projectId: 'superadmin_personal',
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
    const normalizedProjectId = projectId || 'superadmin_personal';
    try {
      this.setState({ insightsLoading: true, insightsError: null });
      const launches = await fetchLaunchData(normalizedProjectId);
      const insightsData = transformLaunchesToInsightsData(launches, normalizedProjectId);
      this.setState({
        insightsData,
        insightsLoading: false,
        selectedLaunchName: insightsData.sprintRows?.[0]?.[0] || '',
        expandedReleaseKeys: (insightsData.releases || []).flatMap((release) =>
          release.sprints.slice(0, 1).map((sprint) => `${release.title}-${sprint.name}`),
        ),
      });
    } catch (error) {
      this.setState({ insightsLoading: false, insightsError: String(error) });
    }
  };

  setSelectedLaunch = (selectedLaunchName) => {
    this.setState({ selectedLaunchName });
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
    this.setState({ exportMessage: 'Front-end export prepared from the current dummy flakiness filter.' });
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
    const normalizedProjectId = projectId || 'superadmin_personal';
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

    const selectedLaunch =
      (data.sprintRows || []).find(([launch]) => launch === this.state.selectedLaunchName) || (data.sprintRows || [])[0] || [];
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
    const filteredSearchResults = (data.searchResults || []).filter(([, title, meta]) => {
      const matchesQuery =
        !normalizedSearchQuery ||
        title.toLowerCase().includes(normalizedSearchQuery) ||
        meta.toLowerCase().includes(normalizedSearchQuery);
      const matchesProject =
        this.state.searchProject === 'All projects' ||
        meta.toLowerCase().includes(this.state.searchProject.toLowerCase()) ||
        normalizedProjectId === this.state.searchProject;
      return matchesQuery && matchesProject;
    });
    const selectedCluster = (data.clusters || [])[this.state.selectedClusterIndex] || (data.clusters || [])[0] || { signature: 'No clusters', count: 0, firstSeen: '', launches: [], logs: [] };
    const failureCard = (data.failureCardPresets || [])[this.state.selectedClusterIndex] || (data.failureCardPresets || [])[0] || { title: 'No failures', category: 'N/A', launch: '', summary: '', tone: 'neutral' };
    const interactions = {
      summary: {
        data,
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
        failureCard: {
          ...failureCard,
          summary: selectedCluster.signature,
        },
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
              {renderSection(activeSection, normalizedProjectId, interactions)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
