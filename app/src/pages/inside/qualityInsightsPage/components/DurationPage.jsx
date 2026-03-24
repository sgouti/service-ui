import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { DURATION_SECTION } from '../constants';
import { resolveLaunchName, ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader, toneToTextClass } from './ui';

const cx = classNames.bind(styles);

const DurationPage = ({
  projectId,
  data,
  durationWindow,
  durationThreshold,
  filteredDurationRows,
  onChangeDurationWindow,
  onChangeDurationThreshold,
}) => (
  <>
    <div className={cx('filters-row')}>
      <select className={cx('select')} value={durationWindow} onChange={(event) => onChangeDurationWindow(event.target.value)}>
        <option>Last 30 days</option>
        <option>Last 7 days</option>
      </select>
      <select className={cx('select')} value={durationThreshold} onChange={(event) => onChangeDurationThreshold(event.target.value)}>
        <option>Flag: &gt;20% increase</option>
        <option>Flag: &gt;10%</option>
        <option>Show all</option>
      </select>
    </div>
    <div className={cx('metric-grid')}>
      {data.metricCards[DURATION_SECTION].map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
    <Panel title={'Duration regression'} subtitle={'Flagged rows exceed 20% slowdown'}>
      <table className={cx('table')}>
        <thead>
          <tr>
            <th>Test name</th>
            <th>Now avg</th>
            <th>30d ago</th>
            <th>Delta</th>
            <th>Bar</th>
          </tr>
        </thead>
        <tbody>
          {filteredDurationRows.map(([name, nowAvg, previous, delta, bar, tone, launchId]) => (
            <tr key={name}>
              <td className={tone !== 'neutral' ? cx(toneToTextClass[tone]) : undefined}>
                <ResourceLink projectId={projectId} launchId={launchId} launchName={name}>
                  {name}
                </ResourceLink>
              </td>
              <td>{nowAvg}</td>
              <td>{previous}</td>
              <td className={cx(toneToTextClass[tone])}>{delta}</td>
              <td style={{ width: '120px' }}>
                <ProgressBar value={bar} tone={tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  </>
);

DurationPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  durationWindow: PropTypes.string.isRequired,
  durationThreshold: PropTypes.string.isRequired,
  filteredDurationRows: PropTypes.arrayOf(PropTypes.array).isRequired,
  onChangeDurationWindow: PropTypes.func.isRequired,
  onChangeDurationThreshold: PropTypes.func.isRequired,
};

export default DurationPage;
