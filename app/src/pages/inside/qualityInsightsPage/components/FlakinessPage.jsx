import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { FLAKINESS_SECTION } from '../constants';
import { resolveLaunchName, ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader, toneToTextClass } from './ui';

const cx = classNames.bind(styles);

const FlakinessPage = ({
  projectId,
  data,
  flakinessWindow,
  flakinessMinimum,
  filteredFlakyTests,
  onChangeFlakinessWindow,
  onChangeFlakinessMinimum,
  exportMessage,
  onExportFlakiness,
}) => (
  <>
    <div className={cx('filters-row')}>
      <select className={cx('select')} value={flakinessWindow} onChange={(event) => onChangeFlakinessWindow(event.target.value)}>
        <option>Last 30 days</option>
        <option>Last 7 days</option>
        <option>Last 90 days</option>
      </select>
      <select className={cx('select')} value={flakinessMinimum} onChange={(event) => onChangeFlakinessMinimum(event.target.value)}>
        <option>Min: 5%</option>
        <option>Min: 20%</option>
        <option>Min: 40%</option>
        <option>Show all</option>
      </select>
      <span className={cx('hint')}>Flaky means both pass and fail inside the same window.</span>
    </div>
    <div className={cx('metric-grid')}>
      {data.metricCards[FLAKINESS_SECTION].map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
    <Panel title={'Flakiness rate - last 30 days'}>
      <MiniChart values={data.flakinessTrend} tone={'danger'} />
    </Panel>
    <Panel title={'Top flaky tests'} action={<Button onClick={onExportFlakiness}>Export CSV</Button>}>
      {exportMessage ? <div className={cx('status-message')}>{exportMessage}</div> : null}
      <table className={cx('table')}>
        <thead>
          <tr>
            <th>Test name</th>
            <th>Flaky %</th>
            <th>Fails / runs</th>
            <th>Trend</th>
            <th>Sparkline</th>
            <th>Last flaky</th>
          </tr>
        </thead>
        <tbody>
          {filteredFlakyTests.map(([name, flaky, ratio, trend, spark, lastFlaky, tone]) => (
            <tr key={name}>
              <td>
                <ResourceLink projectId={projectId} launchName={resolveLaunchName(data, name)}>
                  {name}
                </ResourceLink>
              </td>
              <td>
                <Badge tone={tone}>{flaky}</Badge>
              </td>
              <td>{ratio}</td>
              <td className={cx(toneToTextClass[tone])}>{trend}</td>
              <td>
                <Sparkline values={spark} tone={tone} />
              </td>
              <td>{lastFlaky}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  </>
);

FlakinessPage.propTypes = {
  projectId: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  flakinessWindow: PropTypes.string.isRequired,
  flakinessMinimum: PropTypes.string.isRequired,
  filteredFlakyTests: PropTypes.arrayOf(PropTypes.array).isRequired,
  onChangeFlakinessWindow: PropTypes.func.isRequired,
  onChangeFlakinessMinimum: PropTypes.func.isRequired,
  exportMessage: PropTypes.string,
  onExportFlakiness: PropTypes.func.isRequired,
};

FlakinessPage.defaultProps = {
  exportMessage: '',
};

export default FlakinessPage;
