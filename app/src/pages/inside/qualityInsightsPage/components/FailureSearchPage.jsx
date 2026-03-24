import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const FailureSearchPage = ({
  projectId,
  data,
  projects,
  searchTerm,
  searchProject,
  filteredSearchResults,
  selectedSearchResultIndex,
  onChangeSearchTerm,
  onChangeSearchProject,
  onSelectSearchResult,
}) => (
  <>
    <div className={cx('filters-row')}>
      <input className={cx('input')} value={searchTerm} onChange={(event) => onChangeSearchTerm(event.target.value)} />
      <select className={cx('select')} value={searchProject} onChange={(event) => onChangeSearchProject(event.target.value)}>
        <option>All projects</option>
        {projects.map((project) => (
          <option key={project}>{project}</option>
        ))}
      </select>
      <Button primary>Live filter</Button>
    </div>
    <div className={cx('hint')} style={{ marginBottom: '12px' }}>
      {`${filteredSearchResults.length} results merged from BM25 keyword match and FAISS semantic similarity.`}
    </div>
    <div className={cx('search-layout')}>
      <div>
        {filteredSearchResults.map(([score, title, meta, ticket, state, owner], index) => (
          <div
            key={`${score}-${title}`}
            className={cx('search-result', { 'interactive-card-active': selectedSearchResultIndex === index })}
            onClick={() => onSelectSearchResult(index)}
          >
            <div className={cx('search-head')}>
              <Badge tone={'info'}>{score}</Badge>
              <div className={cx('search-main')}>
                <div className={cx('panel-title', 'mono')}>
                  <ResourceLink projectId={projectId} launchName={extractLaunchNameFromMeta(meta)}>
                    {title}
                  </ResourceLink>
                </div>
                <div className={cx('hint')}>
                  <ResourceLink projectId={projectId} launchName={extractLaunchNameFromMeta(meta)}>
                    {meta}
                  </ResourceLink>
                </div>
              </div>
            </div>
            <div className={cx('result-meta')}>
              {ticket ? <Badge tone={'info'}>{ticket}</Badge> : null}
              <Badge tone={state === 'Open' ? 'warning' : 'success'}>{state}</Badge>
              {owner ? <span className={cx('hint')}>{owner}</span> : null}
            </div>
          </div>
        ))}
      </div>
      <aside>
        <Panel title={'How this search works'}>
          <div className={cx('how-list')}>
            {data.searchHowItWorks.map(([name, copy, weight, tone]) => (
              <div key={name} className={cx('how-item')}>
                <div className={cx('panel-title')}>{name}</div>
                <div className={cx('hint')}>{copy}</div>
                <div style={{ marginTop: '8px' }}>
                  <ProgressBar value={weight} tone={tone} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={'Error type breakdown'}>
          <div className={cx('donut-stack')}>
            {data.searchBreakdown.map(([label, count, tone]) => (
              <div key={label} className={cx('donut-pill')}>
                <div className={cx('legend-swatch', `progress-fill-${tone}`)} />
                <div>
                  <div className={cx('panel-title')}>{label}</div>
                  <div className={cx('hint')}>{`${count} matches`}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  </>
);

FailureSearchPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  projects: PropTypes.arrayOf(PropTypes.string).isRequired,
  searchTerm: PropTypes.string.isRequired,
  searchProject: PropTypes.string.isRequired,
  filteredSearchResults: PropTypes.arrayOf(PropTypes.array).isRequired,
  selectedSearchResultIndex: PropTypes.number.isRequired,
  onChangeSearchTerm: PropTypes.func.isRequired,
  onChangeSearchProject: PropTypes.func.isRequired,
  onSelectSearchResult: PropTypes.func.isRequired,
};

export default FailureSearchPage;
