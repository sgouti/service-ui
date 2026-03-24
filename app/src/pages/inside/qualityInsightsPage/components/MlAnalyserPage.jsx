import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ML_ANALYSER_SECTION } from '../constants';
import { resolveLaunchName, ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const MlAnalyserPage = ({ projectId, data, analysisCategory, onSelectAnalysisCategory }) => (
  <>
    <Panel title={'Analysis pipeline'}>
      <div className={cx('pipeline')}>
        {data.analysisPipeline.map(([label, title, copy]) => (
          <div key={title} className={cx('pipeline-step')}>
            <div className={cx('pipeline-label')}>{label}</div>
            <div className={cx('pipeline-title')}>{title}</div>
            <div className={cx('pipeline-copy')}>{copy}</div>
          </div>
        ))}
      </div>
    </Panel>
    <div className={cx('metric-grid')}>
      {data.metricCards[ML_ANALYSER_SECTION].map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
    <div className={cx('actions-row')}>
      {['all', 'Product bug', 'System issue', 'To investigate'].map((category) => (
        <button
          key={category}
          type="button"
          className={cx('pill-button', { 'pill-button-active': analysisCategory === category })}
          onClick={() => onSelectAnalysisCategory(category)}
        >
          {category === 'all' ? 'All categories' : category}
        </button>
      ))}
    </div>
    <div className={cx('two-column')}>
      <Panel title={'Defect category breakdown'}>
        {data.defectBreakdown.map(([label, count, value, tone]) => (
          <div key={label} className={cx('category-row')}>
            <div className={cx('category-dot', `progress-fill-${tone}`)} />
            <div className={cx('category-main')}>
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
            <div style={{ width: '120px' }}>
              <ProgressBar value={value} tone={tone} />
            </div>
          </div>
        ))}
      </Panel>
      <Panel title={'Per-failure analysis log'}>
        <table className={cx('table')}>
          <thead>
            <tr>
              <th>Test</th>
              <th>Cluster</th>
              <th>Category</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.analysisRows
              .filter(([, , category]) => analysisCategory === 'all' || category === analysisCategory)
              .map(([test, cluster, category, score, tone]) => (
              <tr key={test}>
                <td className={cx('mono')}>
                  <ResourceLink projectId={projectId} launchName={resolveLaunchName(data, test)}>
                    {test}
                  </ResourceLink>
                </td>
                <td>{cluster}</td>
                <td>
                  <Badge tone={tone}>{category}</Badge>
                </td>
                <td className={score === 'novel' ? cx('hint') : cx('status-cell-success')}>{score}</td>
              </tr>
              ))}
          </tbody>
        </table>
      </Panel>
    </div>
  </>
);

MlAnalyserPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  analysisCategory: PropTypes.string.isRequired,
  onSelectAnalysisCategory: PropTypes.func.isRequired,
};

export default MlAnalyserPage;
