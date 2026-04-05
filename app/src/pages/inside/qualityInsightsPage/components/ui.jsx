import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { NavLink } from 'redux-first-router-link';
import styles from '../qualityInsightsPage.scss';
import { PROJECT_LAUNCHES_PAGE, TEST_ITEM_PAGE } from 'controllers/pages';
import { ALL } from 'common/constants/reservedFilterIds';

const cx = classNames.bind(styles);

const toneToBadgeClass = {
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export const toneToTextClass = {
  success: 'tone-success',
  danger: 'tone-danger',
  warning: 'tone-warning',
  info: 'tone-info',
  neutral: 'tone-neutral',
};

const progressToneClass = {
  success: 'progress-fill-success',
  danger: 'progress-fill-danger',
  warning: 'progress-fill-warning',
  info: 'progress-fill-info',
  neutral: 'progress-fill-neutral',
};

const chartToneClass = {
  success: '',
  danger: 'chart-bar-danger',
  warning: 'chart-bar-warning',
  info: 'chart-bar-info',
};

const sparkToneClass = {
  success: 'spark-bar-success',
  danger: 'spark-bar-danger',
  warning: 'spark-bar-danger',
  info: 'spark-bar-success',
  neutral: '',
};

const launchFilterKey = 'filter.cnt.name';

const getLaunchesPageLink = (projectId, launchName) => ({
  type: PROJECT_LAUNCHES_PAGE,
  payload: {
    projectId,
    filterId: ALL,
  },
  meta: launchName
    ? {
        query: {
          [launchFilterKey]: launchName,
        },
      }
    : undefined,
});

const getLaunchByIdLink = (projectId, launchId) => ({
  type: TEST_ITEM_PAGE,
  payload: {
    projectId,
    filterId: ALL,
    testItemIds: String(launchId),
  },
});

const Badge = ({ tone, children, className }) => (
  <span className={cx('badge', toneToBadgeClass[tone], className)}>{children}</span>
);

Badge.propTypes = {
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'neutral']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Badge.defaultProps = {
  tone: 'neutral',
  className: '',
};

const Button = ({ primary, block, children, onClick, disabled, className }) => (
  <button
    type="button"
    className={cx('button', className, { 'button-primary': primary, 'button-block': block })}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

Button.propTypes = {
  primary: PropTypes.bool,
  block: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

Button.defaultProps = {
  primary: false,
  block: false,
  onClick: () => {},
  disabled: false,
  className: '',
};

const ResourceLink = ({ projectId, launchName, launchId, children, className }) => {
  if (launchId) {
    return (
      <NavLink to={getLaunchByIdLink(projectId, launchId)} className={cx('resource-link', className)}>
        {children}
      </NavLink>
    );
  }
  if (launchName) {
    return (
      <NavLink to={getLaunchesPageLink(projectId, launchName)} className={cx('resource-link', className)}>
        {children}
      </NavLink>
    );
  }
  return <span className={cx(className)}>{children}</span>;
};

ResourceLink.propTypes = {
  projectId: PropTypes.string.isRequired,
  launchName: PropTypes.string,
  launchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ResourceLink.defaultProps = {
  launchName: '',
  launchId: null,
  className: '',
};

const MetricCard = ({ label, value, note, tone }) => (
  <div className={cx('metric-card')}>
    <div className={cx('metric-label')}>{label}</div>
    <div className={cx('metric-value', tone && toneToTextClass[tone])}>{value}</div>
    {note ? <div className={cx('metric-note', tone && toneToTextClass[tone])}>{note}</div> : null}
  </div>
);

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  note: PropTypes.string,
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'neutral']),
};

MetricCard.defaultProps = {
  note: '',
  tone: undefined,
};

const Panel = ({ title, subtitle, action, children }) => (
  <section className={cx('panel')}>
    <div className={cx('panel-header')}>
      <div className={cx('panel-title')}>{title}</div>
      {subtitle ? <div className={cx('panel-subtitle')}>{subtitle}</div> : null}
      {action}
    </div>
    <div className={cx('panel-body')}>{children}</div>
  </section>
);

Panel.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
};

Panel.defaultProps = {
  subtitle: '',
  action: null,
};

const MiniChart = ({ values, tone, label }) => {
  const max = Math.max(...values);

  return (
    <div className={cx('chart-card')}>
      {values.map((value, index) => (
        <div
          key={`${tone}-${index}`}
          className={cx('chart-bar', chartToneClass[tone])}
          style={{ height: `${Math.max((value / max) * 100, 12)}%` }}
          title={`${label || 'Value'}: ${value}${tone === 'success' || tone === 'danger' ? '%' : ''}`}
        />
      ))}
    </div>
  );
};

MiniChart.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info']),
  label: PropTypes.string,
};

MiniChart.defaultProps = {
  tone: 'success',
  label: '',
};

const ProgressBar = ({ value, tone, label }) => (
  <div className={cx('progress-track')} title={label || `${value}%`}>
    <div className={cx('progress-fill', progressToneClass[tone])} style={{ width: `${value}%` }} />
  </div>
);

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'neutral']),
  label: PropTypes.string,
};

ProgressBar.defaultProps = {
  tone: 'neutral',
  label: '',
};

const Sparkline = ({ values, tone }) => {
  const max = Math.max(...values);

  return (
    <div className={cx('sparkline')}>
      {values.map((value, index) => (
        <div
          key={`${tone}-${index}`}
          className={cx('spark-bar', sparkToneClass[tone])}
          style={{ height: `${Math.max((value / max) * 100, 18)}%` }}
          title={`${value}%`}
        />
      ))}
    </div>
  );
};

Sparkline.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'neutral']),
};

Sparkline.defaultProps = {
  tone: 'neutral',
};

export const DonutRing = ({ value, color, size = 64, stroke = 7 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className={cx('donut-svg')}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

DonutRing.propTypes = {
  value: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  stroke: PropTypes.number,
};

DonutRing.defaultProps = {
  size: 64,
  stroke: 7,
};

export const normalizeTestName = (testName) => String(testName || '').split('::').pop().trim();

export const extractLaunchNameFromMeta = (meta) => {
  const parts = String(meta || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
};

export const resolveLaunchName = (data, testName, fallbackLaunchName = '') => {
  const normalizedName = normalizeTestName(testName);
  return (
    (typeof testName === 'object' && testName?.launchName) ||
    data.testLaunchMap?.[testName] ||
    data.testLaunchMap?.[normalizedName] ||
    (typeof testName === 'object' && (data.testLaunchMap?.[testName?.stableKey] || data.testLaunchMap?.[String(testName?.itemId)])) ||
    fallbackLaunchName ||
    data.sprintRows?.[0]?.[0] ||
    ''
  );
};

export { Badge, Button, ResourceLink, MetricCard, Panel, MiniChart, ProgressBar, Sparkline };
