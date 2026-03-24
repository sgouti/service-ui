import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { TRENDS_SECTION } from '../constants';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const TrendsPage = ({
  data,
  trendsWindow,
  trendsGranularity,
  trendsComparePrevious,
  displayedPassRateTrend,
  displayedFailureCountTrend,
  onChangeTrendsWindow,
  onChangeTrendsGranularity,
  onToggleTrendsComparePrevious,
}) => (
  <>
    <div className={cx('filters-row')}>
      <select className={cx('select')} value={trendsWindow} onChange={(event) => onChangeTrendsWindow(event.target.value)}>
        <option>Last 30 days</option>
        <option>Last 7 days</option>
        <option>Last 90 days</option>
      </select>
      <select className={cx('select')} value={trendsGranularity} onChange={(event) => onChangeTrendsGranularity(event.target.value)}>
        <option>Granularity: day</option>
        <option>Granularity: week</option>
      </select>
      <label className={cx('checkbox-row')}>
        <input type="checkbox" checked={trendsComparePrevious} onChange={onToggleTrendsComparePrevious} />
        <span className={cx('hint')}>Compare previous period</span>
      </label>
    </div>
    <div className={cx('metric-grid')}>
      {data.metricCards[TRENDS_SECTION].map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
    <Panel title={'Pass rate - calendar date range'} subtitle={'not launch-scoped'}>
      <MiniChart values={displayedPassRateTrend} tone={'success'} />
    </Panel>
    <Panel title={'Failure count per day'}>
      <MiniChart values={displayedFailureCountTrend} tone={'danger'} />
    </Panel>
    {trendsComparePrevious ? <div className={cx('status-message')}>Previous-period comparison is enabled for the current dummy range.</div> : null}
  </>
);

TrendsPage.propTypes = {
  data: PropTypes.object.isRequired,
  trendsWindow: PropTypes.string.isRequired,
  trendsGranularity: PropTypes.string.isRequired,
  trendsComparePrevious: PropTypes.bool.isRequired,
  displayedPassRateTrend: PropTypes.arrayOf(PropTypes.number).isRequired,
  displayedFailureCountTrend: PropTypes.arrayOf(PropTypes.number).isRequired,
  onChangeTrendsWindow: PropTypes.func.isRequired,
  onChangeTrendsGranularity: PropTypes.func.isRequired,
  onToggleTrendsComparePrevious: PropTypes.func.isRequired,
};

export default TrendsPage;
