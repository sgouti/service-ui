import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const FailureCardPage = ({
  projectId,
  data,
  failureCard,
  selectedDefectType,
  onSelectDefectType,
  showRawLog,
  onToggleRawLog,
}) => (
  <div className={cx('split-layout')}>
    <div className={cx('split-main')}>
      <section className={cx('panel')}>
        <div className={cx('panel-header')}>
          <Badge tone={'danger'}>Failed</Badge>
          <div className={cx('panel-title', 'mono')}>
            <ResourceLink projectId={projectId} launchName={failureCard.launch}>
              {failureCard.title}
            </ResourceLink>
          </div>
          <div className={cx('panel-subtitle')}>
            {failureCard.duration}
            {', '}
            <ResourceLink projectId={projectId} launchName={failureCard.launch}>
              {failureCard.launch}
            </ResourceLink>
          </div>
        </div>
        <div className={cx('panel-body')}>
          <div className={cx('section-caption')}>Auto-parsed failure summary</div>
          <div className={cx('stack-box')}>
            <div className={cx('code-line')}>{failureCard.summary}</div>
            <div className={cx('code-meta')}>{failureCard.location}</div>
            <div className={cx('key-value-grid')}>
              <span>Expected</span>
              <strong>{failureCard.expected}</strong>
              <span>Actual</span>
              <strong className={cx('tone-danger')}>{failureCard.actual}</strong>
            </div>
          </div>
          <div className={cx('section-caption')} style={{ marginTop: '14px' }}>
            Defect type
          </div>
          <div className={cx('actions-row')}>
            {['Product bug', 'Automation bug', 'System issue', 'Link Jira'].map((option) => (
              <button
                key={option}
                type="button"
                className={cx('pill-button', {
                  'pill-button-active': selectedDefectType === option,
                })}
                onClick={() => onSelectDefectType(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <Button onClick={onToggleRawLog}>{showRawLog ? 'Hide raw log' : 'View raw log'}</Button>
          {showRawLog ? (
            <div className={cx('stack-box')} style={{ marginTop: '12px' }}>
              {failureCard.rawLog.map((line) => (
                <div key={line} className={cx('code-meta')}>
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div className={cx('hint')}>Raw log is collapsed until opened from the front-end interaction.</div>
          )}
        </div>
      </section>
    </div>
    <aside className={cx('split-side')}>
      <Panel title={'Similar failures'} action={<Badge tone={'info'}>FAISS top-5</Badge>}>
        <div className={cx('similar-list')}>
          {data.similarFailures.map(([score, test, launch, ticket, state]) => (
            <div key={`${test}-${launch}`} className={cx('similar-item')}>
              <div className={cx('similar-head')}>
                <span className={cx('tone-info')}>{score}</span>
                <strong>
                  <ResourceLink projectId={projectId} launchName={launch}>
                    {test}
                  </ResourceLink>
                </strong>
              </div>
              <div className={cx('result-meta')}>
                <ResourceLink projectId={projectId} launchName={launch}>
                  {launch}
                </ResourceLink>
                {ticket ? <Badge tone={'info'}>{ticket}</Badge> : null}
                <Badge tone={state === 'Open' ? 'warning' : 'success'}>{state}</Badge>
              </div>
            </div>
          ))}
        </div>
        <Button block>Search more like this</Button>
      </Panel>
    </aside>
  </div>
);

FailureCardPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  failureCard: PropTypes.shape({
    title: PropTypes.string.isRequired,
    launch: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    expected: PropTypes.string.isRequired,
    actual: PropTypes.string.isRequired,
    rawLog: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  selectedDefectType: PropTypes.string.isRequired,
  onSelectDefectType: PropTypes.func.isRequired,
  showRawLog: PropTypes.bool.isRequired,
  onToggleRawLog: PropTypes.func.isRequired,
};

export default FailureCardPage;
