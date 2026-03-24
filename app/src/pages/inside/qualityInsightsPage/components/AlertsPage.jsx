import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './ui';

const cx = classNames.bind(styles);

const AlertsPage = ({
  alertRuleState,
  alertHistory,
  digestState,
  onToggleAlertRule,
  onChangeDigestField,
  onToggleDigestTopic,
  onSaveDigest,
}) => (
  <>
    {alertRuleState.map(({ name, condition, state, active, channels }) => (
      <section key={name} className={cx('alert-card')}>
        <div className={cx('alert-header')}>
          <div className={cx('alert-main')}>
            <div className={cx('panel-title')}>{name}</div>
            <div className={cx('hint')}>{`Condition: ${condition}`}</div>
          </div>
          <Badge tone={state.includes('Never') ? 'neutral' : state.includes('Duration') ? 'warning' : 'danger'}>
            {state}
          </Badge>
          <button
            type="button"
            className={cx('toggle', active ? 'toggle-on' : 'toggle-off')}
            onClick={() => onToggleAlertRule(name)}
          />
        </div>
        <div className={cx('alert-footer')}>
          <span>Notify via:</span>
          {channels.map((channel) => (
            <Badge key={channel} tone={'info'}>{channel}</Badge>
          ))}
        </div>
      </section>
    ))}
    <Panel title={'Scheduled digest'}>
      <div className={cx('share-settings')}>
        <span>Schedule:</span>
        <select className={cx('select')} value={digestState.schedule} onChange={(event) => onChangeDigestField('schedule', event.target.value)}>
          <option>Daily</option>
          <option>Weekly</option>
        </select>
        <span>at</span>
        <select className={cx('select')} value={digestState.time} onChange={(event) => onChangeDigestField('time', event.target.value)}>
          <option>08:00</option>
          <option>09:00</option>
        </select>
        <label className={cx('checkbox-row')}>
          <input type="checkbox" checked={digestState.topics.passRate} onChange={() => onToggleDigestTopic('passRate')} />
          <span>Pass rate</span>
        </label>
        <label className={cx('checkbox-row')}>
          <input type="checkbox" checked={digestState.topics.flakyTests} onChange={() => onToggleDigestTopic('flakyTests')} />
          <span>Flaky tests</span>
        </label>
        <label className={cx('checkbox-row')}>
          <input type="checkbox" checked={digestState.topics.newFailures} onChange={() => onToggleDigestTopic('newFailures')} />
          <span>New failures</span>
        </label>
        <label className={cx('checkbox-row')}>
          <input type="checkbox" checked={digestState.topics.duration} onChange={() => onToggleDigestTopic('duration')} />
          <span>Duration</span>
        </label>
        <Button onClick={onSaveDigest}>Save</Button>
      </div>
      {digestState.savedMessage ? <div className={cx('status-message')}>{digestState.savedMessage}</div> : null}
    </Panel>
    <Panel title={'Alert history'}>
      <table className={cx('table')}>
        <thead>
          <tr>
            <th>Rule</th>
            <th>Launch</th>
            <th>Value</th>
            <th>Channel</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {alertHistory.map(([rule, launch, value, channel, time]) => (
            <tr key={`${rule}-${launch}-${time}`}>
              <td>{rule}</td>
              <td>{launch}</td>
              <td className={cx('status-cell-danger')}>{value}</td>
              <td>
                <Badge tone={'info'}>{channel}</Badge>
              </td>
              <td>{time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  </>
);

AlertsPage.propTypes = {
  alertRuleState: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    condition: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    channels: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  alertHistory: PropTypes.arrayOf(PropTypes.array).isRequired,
  digestState: PropTypes.shape({
    schedule: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    savedMessage: PropTypes.string,
    topics: PropTypes.shape({
      passRate: PropTypes.bool.isRequired,
      flakyTests: PropTypes.bool.isRequired,
      newFailures: PropTypes.bool.isRequired,
      duration: PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
  onToggleAlertRule: PropTypes.func.isRequired,
  onChangeDigestField: PropTypes.func.isRequired,
  onToggleDigestTopic: PropTypes.func.isRequired,
  onSaveDigest: PropTypes.func.isRequired,
};

export default AlertsPage;
