import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Panel, ProgressBar, extractLaunchNameFromMeta } from './ui';

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
}) => {
  const selectedSearchResult =
    filteredSearchResults[selectedSearchResultIndex] || filteredSearchResults[0] || null;
  const [selectedScore, selectedTitle, selectedMeta, selectedTicket, selectedState, selectedOwner] =
    selectedSearchResult || [];
  const selectedLaunchName = extractLaunchNameFromMeta(selectedMeta);

  return (
    <>
      <div className={cx('filters-row')}>
        <input className={cx('input')} value={searchTerm} onChange={(event) => onChangeSearchTerm(event.target.value)} />
        <select className={cx('select')} value={searchProject} onChange={(event) => onChangeSearchProject(event.target.value)}>
          <option>All projects</option>
          {projects.map((project) => (
            <option key={project}>{project}</option>
          ))}
        </select>
        <Badge tone={'info'}>Live project data</Badge>
      </div>
      <div className={cx('hint')} style={{ marginBottom: '12px' }}>
        {`${filteredSearchResults.length} unique results ranked from semantic and keyword matching for ${searchProject === 'All projects' ? 'the selected project' : searchProject}.`}
      </div>
      <div className={cx('search-layout')}>
        <div>
          {filteredSearchResults.length ? filteredSearchResults.map(([score, title, meta, ticket, state, owner], index) => {
            const launchName = extractLaunchNameFromMeta(meta);

            return (
              <div
                key={`${score}-${title}-${meta}-${index}`}
                className={cx('search-result', { 'interactive-card-active': selectedSearchResultIndex === index })}
                onClick={() => onSelectSearchResult(index)}
              >
                <div className={cx('search-head')}>
                  <Badge tone={'info'}>{score}</Badge>
                  <div className={cx('search-main')}>
                    <div className={cx('panel-title', 'mono')}>
                      <ResourceLink projectId={projectId} launchName={launchName}>
                        {title}
                      </ResourceLink>
                    </div>
                    <div className={cx('hint')}>
                      <ResourceLink projectId={projectId} launchName={launchName}>
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
            );
          }) : (
            <Panel title={'No matching failures'} subtitle={'Try a broader term or clear the project filter.'}>
              <div className={cx('hint')}>No failure signatures matched the current search input.</div>
            </Panel>
          )}
        </div>
        <aside>
          <Panel title={'Selected failure'} subtitle={selectedLaunchName || 'No launch matched'}>
            {selectedSearchResult ? (
              <div className={cx('how-list')}>
                <div className={cx('how-item')}>
                  <div className={cx('panel-title', 'mono')}>
                    <ResourceLink projectId={projectId} launchName={selectedLaunchName}>
                      {selectedTitle}
                    </ResourceLink>
                  </div>
                  <div className={cx('hint')}>{selectedMeta}</div>
                  <div className={cx('result-meta')} style={{ marginTop: '8px' }}>
                    <Badge tone={'info'}>{`Score ${selectedScore}`}</Badge>
                    <Badge tone={selectedState === 'Open' ? 'warning' : 'success'}>{selectedState}</Badge>
                    {selectedTicket ? <Badge tone={'info'}>{selectedTicket}</Badge> : null}
                  </div>
                  {selectedOwner ? <div className={cx('hint')} style={{ marginTop: '8px' }}>{`Owner ${selectedOwner}`}</div> : null}
                </div>
              </div>
            ) : (
              <div className={cx('hint')}>Select a failure result to inspect its launch context.</div>
            )}
          </Panel>
          <Panel title={'How this search works'} subtitle={'Live ranking weights'}>
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
};

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
