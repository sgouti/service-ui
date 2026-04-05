import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { CLUSTER_VIEW_SECTION } from '../constants';
import { ResourceLink, Badge, MetricCard, Panel } from './ui';

const cx = classNames.bind(styles);

const STATUS_OPTIONS = ['all', 'active', 'flaky', 'resolved', 'regressed', 'unknown'];
const DEFECT_OPTIONS = ['all', 'To investigate', 'Product bug', 'Automation bug', 'System issue'];

const polishFailureSummary = (value) => {
  const text = String(value || '').trim();

  if (!text) {
    return 'Failure signature';
  }

  const expectedMatch = text.match(/Expected substring\s+(.+)$/i);
  if (expectedMatch) {
    return `Assertion mismatch: expected substring ${expectedMatch[1]}`;
  }

  return text.replace(/^Error\s+/i, '').replace(/\s+/g, ' ').trim().slice(0, 120);
};

const matchesFilters = (item, statusFilter, defectFilter, searchValue) => {
  const normalizedSearch = String(searchValue || '').trim().toLowerCase();
  const matchesStatus =
    statusFilter === 'all' || String(item.lifecycleState || '').toLowerCase() === statusFilter;
  const matchesDefect = defectFilter === 'all' || item.defectType === defectFilter;
  const matchesSearch =
    !normalizedSearch ||
    [item.testName, item.summary, item.location, item.launchName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));

  return matchesStatus && matchesDefect && matchesSearch;
};

const ClusterViewPage = ({
  projectId,
  data,
  selectedClusterIndex,
  onSelectCluster,
  selectedNovelIndex,
  onSelectNovelFailure,
}) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [defectFilter, setDefectFilter] = React.useState('all');
  const [searchValue, setSearchValue] = React.useState('');
  const [triagedFailures, setTriagedFailures] = React.useState({});

  const metricCards = data.metricCards?.[CLUSTER_VIEW_SECTION] || [];
  const clusters = data.clusters || [];
  const selectedCluster = clusters[selectedClusterIndex] || clusters[0] || null;
  const clusterMembers = (selectedCluster?.members || []).filter((member) =>
    matchesFilters(member, statusFilter, defectFilter, searchValue),
  );
  const unclusteredFailures = (data.unclusteredFailures || []).filter((failure) =>
    matchesFilters(failure, statusFilter, defectFilter, searchValue),
  );

  const markInvestigated = (failure) => {
    const key = failure.stableKey || failure.itemId || `${failure.testName}-${failure.location}`;
    setTriagedFailures((current) => ({
      ...current,
      [key]: current[key] ? undefined : 'Queued for investigation',
    }));
  };

  return (
    <>
      <div className={cx('metric-grid')}>
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <Panel title={'Cluster filters'} subtitle={'Narrow failures by lifecycle, defect, and search text'}>
        <div className={cx('actions-row')}>
          <label className={cx('hint')}>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={cx('hint')}>
            Defect
            <select value={defectFilter} onChange={(event) => setDefectFilter(event.target.value)}>
              {DEFECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={cx('hint')}>
            Search
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={'test, launch, summary'}
            />
          </label>
        </div>
      </Panel>

      <div className={cx('actions-row')}>
        {clusters.map((cluster, index) => (
          <button
            key={cluster.clusterKey || cluster.name}
            type="button"
            className={cx('pill-button', { 'pill-button-active': selectedClusterIndex === index })}
            onClick={() => onSelectCluster(index)}
          >
            {cluster.name}
          </button>
        ))}
      </div>

      {selectedCluster ? (
        <section className={cx('cluster-card', { 'interactive-card-active': true })}>
          <div className={cx('cluster-header', `cluster-header-${selectedCluster.tone}`)}>
            <Badge tone={selectedCluster.tone}>{selectedCluster.status || 'unknown'}</Badge>
            <div>
              <div className={cx('panel-title')}>{polishFailureSummary(selectedCluster.summary)}</div>
              <div className={cx('hint')}>
                {selectedCluster.subtitle}
                {selectedCluster.memberSourceLabel ? ` • ${selectedCluster.memberSourceLabel}` : ''}
                {selectedCluster.affectedTests ? ` • ${selectedCluster.affectedTests} tests` : ''}
                {selectedCluster.affectedLaunches ? ` • ${selectedCluster.affectedLaunches} launches` : ''}
              </div>
            </div>
          </div>

          <div className={cx('cluster-body')}>
            <div className={cx('section-caption')}>Cluster signature</div>
            <div className={cx('signature-box', 'mono')}>
              {polishFailureSummary(selectedCluster.signature)}
            </div>

            {clusterMembers.length ? (
              <table className={cx('table')}>
                <thead>
                  <tr>
                    <th>Test name</th>
                    <th>Launch</th>
                    <th>Lifecycle</th>
                    <th>Failure detail</th>
                    <th>Follow-up</th>
                    <th>Similarity</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterMembers.map((member, rowIndex) => (
                    <tr key={`${member.stableKey || member.itemId || member.testName}-${rowIndex}`}>
                      <td className={cx('mono')}>
                        <ResourceLink
                          projectId={projectId}
                          launchId={member.itemId}
                          launchName={member.launchName}
                        >
                          {member.testName}
                        </ResourceLink>
                      </td>
                      <td>{member.launchName}</td>
                      <td>
                        <Badge tone={member.lifecycleTone || 'neutral'}>{member.lifecycleState}</Badge>
                      </td>
                      <td>
                        <div>{polishFailureSummary(member.summary)}</div>
                        <div className={cx('hint', 'mono')}>{member.location}</div>
                      </td>
                      <td>{member.followUpOutcome}</td>
                      <td className={cx('status-cell-success')}>{member.similarity}</td>
                      <td>
                        <Badge tone={member.defectTone}>{member.defectType}</Badge>
                      </td>
                    </tr>
                  ))}
                  {selectedCluster.more ? (
                    <tr>
                      <td colSpan={7} className={cx('hint')}>
                        {selectedCluster.more}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : (
              <div className={cx('hint')}>
                {selectedCluster.emptyMessage || 'No verified cluster members match the current filters.'}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <Panel title={'Unclustered failures'} subtitle={'Latest failed tests without a verified cluster match'}>
        <table className={cx('table')}>
          <thead>
            <tr>
              <th>Test name</th>
              <th>Launch</th>
              <th>Lifecycle</th>
              <th>Failure summary</th>
              <th>Follow-up</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unclusteredFailures.map((failure, index) => {
              const triageKey =
                failure.stableKey || failure.itemId || `${failure.testName}-${failure.location}`;
              const triageLabel = triagedFailures[triageKey] || failure.triageState;

              return (
                <tr
                  key={`${triageKey}-${index}`}
                  className={cx('interactive-row', {
                    'interactive-row-active': selectedNovelIndex === index,
                  })}
                  onClick={() => onSelectNovelFailure(index)}
                >
                  <td className={cx('mono')}>
                    <ResourceLink
                      projectId={projectId}
                      launchId={failure.itemId}
                      launchName={failure.launchName}
                    >
                      {failure.testName}
                    </ResourceLink>
                  </td>
                  <td>{failure.launchName}</td>
                  <td>
                    <Badge tone={failure.lifecycleTone || 'neutral'}>{failure.lifecycleState}</Badge>
                  </td>
                  <td>
                    <div>{polishFailureSummary(failure.summary)}</div>
                    <div className={cx('hint', 'mono')}>{failure.location}</div>
                  </td>
                  <td>{failure.followUpOutcome}</td>
                  <td>
                    <button
                      type="button"
                      className={cx('button')}
                      onClick={(event) => {
                        event.stopPropagation();
                        markInvestigated(failure);
                      }}
                    >
                      {triageLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!unclusteredFailures.length ? (
              <tr>
                <td colSpan={6} className={cx('hint')}>
                  No unclustered failures match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </>
  );
};

ClusterViewPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  selectedClusterIndex: PropTypes.number.isRequired,
  onSelectCluster: PropTypes.func.isRequired,
  selectedNovelIndex: PropTypes.number.isRequired,
  onSelectNovelFailure: PropTypes.func.isRequired,
};

export default ClusterViewPage;
