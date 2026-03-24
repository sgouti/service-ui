import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const ReleasesPage = ({ projectId, data, expandedReleaseKeys, onToggleRelease }) => {
  const [isSprintOpen, setIsSprintOpen] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <div>
           <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Releases</div>
           <div style={{ fontSize: '12px', color: '#475569' }}>Launches auto-assigned to sprints by created date · sprints grouped into releases</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={cx('form-btn', 'form-btn-secondary')} onClick={() => setIsSprintOpen(true)}>+ New sprint</button>
          <button className={cx('form-btn', 'form-btn-primary')} onClick={() => setIsReleaseOpen(true)}>+ New release</button>
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: '#2563eb', marginBottom: '16px' }}>
        <b>How auto-assignment works:</b> When a launch runs, its created date is checked against all sprint date ranges. It's automatically added to the matching sprint. Create sprints with start/end dates first, then launches will self-organise.
      </div>

      <div className={cx('card')} style={{ marginBottom: '20px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', flex: 1 }}>Unassigned launches</div>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', background: '#fffbeb', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}>5 need a sprint</span>
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
            These launches were created before any sprint covered their date range. Assign them manually or create a sprint that includes Mar 21.
          </div>
          <table className={cx('table')} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                <th style={{ padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>Launch</th>
                <th style={{ padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>Created</th>
                <th style={{ padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>Passed</th>
                <th style={{ padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>Failed</th>
                <th style={{ padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Demo Api Tests #5', '17:29 Mar 21', 30, 0],
                ['Demo Api Tests #4', '17:29 Mar 21', 25, 5],
                ['Demo Api Tests #3', '17:29 Mar 21', 20, 8],
                ['Demo Api Tests #2', '17:29 Mar 21', 15, 9],
                ['Demo Api Tests #1', '17:29 Mar 21', 10, 9],
              ].map(([name, date, passed, failed]) => (
                <tr key={name}>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 600, color: '#0f172a' }}>{name}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.12)', color: '#94a3b8' }}>{date}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>{passed}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.12)', ...(failed > 0 ? { color: '#dc2626', fontWeight: 700 } : {}) }}>{failed}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                    <button className={cx('form-btn', 'form-btn-secondary')} style={{ padding: '3px 9px', fontSize: '11px' }}>Assign →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    {data.releases.map((release) => (
      <section key={release.title} className={cx('release-card')}>
        <div className={cx('release-header')}>
          <div className={cx('panel-title')}>{release.title}</div>
          <div className={cx('hint')}>{release.meta}</div>
          <div className={cx('release-rate')}>
            <div className={cx('hint')}>Average pass rate</div>
            <div className={cx('release-rate-value')}>{release.rate}</div>
          </div>
          <Badge tone={release.stateTone}>{release.state}</Badge>
          <div style={{ marginLeft: '12px', display: 'flex', gap: '8px' }}>
            <Button onClick={() => window.alert('Manual Rename/Merge functionality connecting soon...')}>
              Rename/Merge
            </Button>
          </div>
        </div>
        <div className={cx('release-body')}>
          {release.sprints.map((sprint) => (
            <div key={sprint.name} className={cx('release-sprint')}>
              <div className={cx('release-sprint-header')}>
                <div className={cx('release-sprint-main')}>
                  <div className={cx('panel-title')}>{`${sprint.name} ${sprint.dates}`}</div>
                  <div className={cx('hint')}>{sprint.meta}</div>
                </div>
                <div className={cx('hint')}>{`Pass rate ${sprint.rate}`}</div>
                <Badge tone={sprint.tone}>{sprint.state}</Badge>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '8px' }}>
                  <Button onClick={() => window.alert('Adjust sprint boundaries functionality connecting soon...')}>
                    Adjust boundaries
                  </Button>
                </div>
                <Button onClick={() => onToggleRelease(`${release.title}-${sprint.name}`)}>
                  {expandedReleaseKeys.includes(`${release.title}-${sprint.name}`) ? 'Hide launches' : 'Show launches'}
                </Button>
              </div>
              {sprint.launches.length && expandedReleaseKeys.includes(`${release.title}-${sprint.name}`) ? (
                <table className={cx('table')}>
                  <thead>
                    <tr>
                      <th>Launch</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Passed</th>
                      <th>Failed</th>
                      <th>Duration</th>
                      <th>Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprint.launches.map(([launch, type, status, passed, failed, duration, started, tone, launchId]) => (
                      <tr key={launch}>
                        <td>
                          <ResourceLink projectId={projectId} launchId={launchId} launchName={launch}>
                            {launch}
                          </ResourceLink>
                        </td>
                        <td>{type}</td>
                        <td>
                          <Badge tone={tone}>{status}</Badge>
                        </td>
                        <td>{passed}</td>
                        <td className={tone === 'danger' ? cx('status-cell-danger') : undefined}>{failed}</td>
                        <td>{duration}</td>
                        <td>{started}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    ))}
      {isSprintOpen && (
        <div className={cx('modal-overlay')} onClick={() => setIsSprintOpen(false)}>
          <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
            <div className={cx('modal-header')}>
              <div className={cx('modal-title')}>Create sprint</div>
              <button className={cx('modal-close')} onClick={() => setIsSprintOpen(false)}>&times;</button>
            </div>
            <div className={cx('modal-body')}>
              <div className={cx('form-row')}>
                <div className={cx('form-label')}>Sprint name / pattern</div>
                <input className={cx('fi')} type="text" placeholder="e.g. Sprint 34 or sprint-34" />
                <div className={cx('form-hint')}>Use a consistent naming pattern (e.g. sprint-&#123;N&#125;) — all launches matching this pattern will auto-assign</div>
              </div>
              <div className={cx('form-row')}>
                <div className={cx('form-label')}>Date range</div>
                <div className={cx('date-row')}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Start date</div>
                    <input className={cx('fi')} type="date" defaultValue="2026-03-15" />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>End date</div>
                    <input className={cx('fi')} type="date" defaultValue="2026-03-21" />
                  </div>
                </div>
                <div className={cx('form-hint')}>Any launch created between these dates will be automatically added to this sprint</div>
              </div>
              <div className={cx('sprint-range-preview')}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '5px' }}>Auto-assignment preview</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Launches created between <b>Mar 15</b> and <b>Mar 21</b> will be automatically assigned to this sprint. Currently: <b style={{ color: '#059669' }}>5 launches match</b> (all Demo Api Tests #1–#5)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button className={cx('form-btn', 'form-btn-secondary')} onClick={() => setIsSprintOpen(false)}>Cancel</button>
                <button className={cx('form-btn', 'form-btn-primary')} onClick={() => setIsSprintOpen(false)}>Create sprint</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReleaseOpen && (
        <div className={cx('modal-overlay')} onClick={() => setIsReleaseOpen(false)}>
          <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
            <div className={cx('modal-header')}>
              <div className={cx('modal-title')}>Create release</div>
              <button className={cx('modal-close')} onClick={() => setIsReleaseOpen(false)}>&times;</button>
            </div>
            <div className={cx('modal-body')}>
              <div className={cx('form-row')}>
                <div className={cx('form-label')}>Release name</div>
                <input className={cx('fi')} type="text" placeholder="e.g. v2.4.0 or Q1 2026 Release" />
              </div>
              <div className={cx('form-row')}>
                <div className={cx('form-label')}>Sprint range</div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Select the sprints to include in this release. All launches within those sprints will be grouped under this release.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>From sprint</div>
                    <select className={cx('fi')}>
                      <option>— select —</option>
                      <option defaultValue="Sprint 32 (Mar 1–7)">Sprint 32 (Mar 1–7)</option>
                      <option>Sprint 33 (Mar 8–14)</option>
                      <option>Sprint 34 (Mar 15–21)</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>To sprint</div>
                    <select className={cx('fi')}>
                      <option>— select —</option>
                      <option>Sprint 32 (Mar 1–7)</option>
                      <option>Sprint 33 (Mar 8–14)</option>
                      <option defaultValue="Sprint 34 (Mar 15–21)">Sprint 34 (Mar 15–21)</option>
                    </select>
                  </div>
                </div>
                <div className={cx('sprint-range-preview')}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Included sprints</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <span className={cx('sprint-chip')}>Sprint 32 · Mar 1–7</span>
                    <span className={cx('sprint-chip')}>Sprint 33 · Mar 8–14</span>
                    <span className={cx('sprint-chip')}>Sprint 34 · Mar 15–21</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                    Covers <b>Mar 1 – Mar 21</b> · <b style={{ color: '#059669' }}>5 launches</b> will be included
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button className={cx('form-btn', 'form-btn-secondary')} onClick={() => setIsReleaseOpen(false)}>Cancel</button>
                <button className={cx('form-btn', 'form-btn-primary')} onClick={() => setIsReleaseOpen(false)}>Create release</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ReleasesPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  expandedReleaseKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleRelease: PropTypes.func.isRequired,
};

export default ReleasesPage;
