import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { CLUSTER_VIEW_SECTION } from '../constants';
import { resolveLaunchName, ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const ClusterViewPage = ({
  projectId,
  data,
  selectedClusterIndex,
  onSelectCluster,
  selectedNovelIndex,
  onSelectNovelFailure,
}) => (
  <>
    <div className={cx('metric-grid')}>
      {data.metricCards[CLUSTER_VIEW_SECTION].map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
    <div className={cx('actions-row')}>
      {data.clusters.map((cluster, index) => (
        <button
          key={cluster.name}
          type="button"
          className={cx('pill-button', { 'pill-button-active': selectedClusterIndex === index })}
          onClick={() => onSelectCluster(index)}
        >
          {cluster.name}
        </button>
      ))}
    </div>
    {data.clusters.map((cluster, index) => (
      <section
        key={cluster.name}
        className={cx('cluster-card', {
          'interactive-card-active': selectedClusterIndex === index,
        })}
      >
        <div className={cx('cluster-header', `cluster-header-${cluster.tone}`)}>
          <Badge tone={cluster.tone}>{`${cluster.name} ${cluster.count}`}</Badge>
          <div>
            <div className={cx('panel-title')}>{cluster.title}</div>
            <div className={cx('hint')}>{cluster.subtitle}</div>
          </div>
        </div>
        <div className={cx('cluster-body')}>
          <div className={cx('section-caption')}>Common error signature</div>
          <div className={cx('signature-box', 'mono')}>{cluster.signature}</div>
          <table className={cx('table')}>
            <thead>
              <tr>
                <th>Test name</th>
                <th>Duration</th>
                <th>Similarity</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {cluster.rows.map(([name, duration, score, category, tone]) => (
                <tr key={name}>
                  <td className={cx('mono')}>
                    <ResourceLink projectId={projectId} launchName={resolveLaunchName(data, name)}>
                      {name}
                    </ResourceLink>
                  </td>
                  <td>{duration}</td>
                  <td className={cx('status-cell-success')}>{score}</td>
                  <td>
                    <Badge tone={tone}>{category}</Badge>
                  </td>
                </tr>
              ))}
              {cluster.more ? (
                <tr>
                  <td colSpan={4} className={cx('hint')}>
                    {cluster.more}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    ))}
    <Panel title={'Unclustered failures'} subtitle={'Novel failures with no historical match'}>
      <table className={cx('table')}>
        <thead>
          <tr>
            <th>Test name</th>
            <th>Exception</th>
            <th>Root file</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.novelFailures.map(([name, exception, rootFile, action], index) => (
            <tr
              key={name}
              className={cx('interactive-row', {
                'interactive-row-active': selectedNovelIndex === index,
              })}
              onClick={() => onSelectNovelFailure(index)}
            >
              <td className={cx('mono')}>
                <ResourceLink projectId={projectId} launchName={resolveLaunchName(data, name)}>
                  {name}
                </ResourceLink>
              </td>
              <td>{exception}</td>
              <td className={cx('mono')}>{rootFile}</td>
              <td>
                <Badge tone={'neutral'}>{action}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  </>
);

ClusterViewPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  selectedClusterIndex: PropTypes.number.isRequired,
  onSelectCluster: PropTypes.func.isRequired,
  selectedNovelIndex: PropTypes.number.isRequired,
  onSelectNovelFailure: PropTypes.func.isRequired,
};

export default ClusterViewPage;
