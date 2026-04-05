import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import { activeProjectSelector } from 'controllers/user';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import Parser from 'html-react-parser';
import { SpinningPreloader } from 'components/preloaders/spinningPreloader';
import { FAILED } from 'common/constants/testStatuses';

import PlayIcon from 'common/img/arrow-right-inline.svg';
import ArrowIcon from 'common/img/arrow-down-inline.svg';
import PassedIcon from 'common/img/circle-check-inline.svg';
import FailedIcon from 'common/img/circle-cross-icon-inline.svg';
import AttachmentIcon from 'common/img/attachment-inline.svg';
import ArrowReturnIcon from 'common/img/arrow-left-small-inline.svg';

import styles from './testBody.scss';

const cx = classNames.bind(styles);

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const remMs = ms % 1000;
  return remMs > 0 ? `${s}s ${remMs}ms` : `${s}s`;
};

@connect((state) => ({
  activeProject: activeProjectSelector(state),
}))
export class TestBodyTab extends Component {
  static propTypes = {
    activeProject: PropTypes.string.isRequired,
    logItem: PropTypes.object.isRequired,
  };

  state = {
    stepsTree: [],
    loading: true,
  };

  componentDidMount() {
    this.fetchTestBodyTree();
  }

  fetchTestBodyTree = async () => {
    const { activeProject, logItem } = this.props;
    try {
      this.setState({ loading: true });
      // Fetch all root nested steps instead of just 1 log
      const rootLogsResponse = await fetch(URLS.logItems(activeProject, logItem.id));
      const rootLogs = rootLogsResponse.content || [];
      // We only want to display structural test body steps, not regular logs 
      // So we filter out items that don't have a status (like normal INFO logs)
      const structuralLogs = rootLogs.filter(log => log.status);
      const stepsTree = await Promise.all(structuralLogs.map(log => this.fetchStepRecursive(log, activeProject, 0)));
      this.setState({ stepsTree, loading: false });
    } catch (e) {
      console.error('Failed to load Test Body', e);
      this.setState({ loading: false });
    }
  };

  fetchStepRecursive = async (step, activeProject, currentLevel) => {
    const nextLevel = currentLevel + 1;
    if (step.hasContent) {
      try {
        const nestedResponse = await fetch(URLS.logItems(activeProject, step.id));
        const children = nestedResponse.content || [];
        const fullChildren = await Promise.all(children.map(child => this.fetchStepRecursive(child, activeProject, nextLevel)));
        return { ...step, children: fullChildren, level: currentLevel };
      } catch (e) {
        return { ...step, level: currentLevel };
      }
    }
    return { ...step, level: currentLevel };
  };

  renderStatusIcon = (status, isAttachment) => {
    if (isAttachment) {
      return (
        <div className={cx('step-status-icon', 'attachment')}>
          {Parser(AttachmentIcon)}
        </div>
      );
    }
    
    if (status === FAILED) {
      return (
        <div className={cx('step-status-icon', 'failed')}>
          {Parser(FailedIcon)}
        </div>
      );
    }
    
    // Default to passed/success icon just like Allure screenshot
    return (
      <div className={cx('step-status-icon', 'passed')}>
        {Parser(PassedIcon)}
      </div>
    );
  };

  renderStep = (item, index) => {
    // Treat as nested step if it has content or is designated as a step vs a log
    const name = item.name || item.message || '';
    const hasContent = item.hasContent;
    const isAttachment = !!item.binaryContent;
    const levelStyle = `level-${item.level || 0}`;
    const collapsed = item.collapsed !== false; // Default to collapsed in allure unless manually expanded, but we will just rely on Redux tree if present
    
    let duration = 0;
    if (item.startTime && item.endTime) {
      duration = new Date(item.endTime).getTime() - new Date(item.startTime).getTime();
    } else if (item.approximateDuration) {
      duration = item.approximateDuration;
    }

    return (
      <Fragment key={item.id || index}>
        <div className={cx('step-row', levelStyle)}>
          <div className={cx('step-expand-icon', { hidden: !hasContent, expanded: !collapsed })}>
              {Parser(ArrowIcon)}
          </div>
          
          {this.renderStatusIcon(item.status, isAttachment)}
          
          <div className={cx('step-number')}>{index + 1}</div>
          
          <div className={cx('step-name')}>
            {name}
          </div>
          
          {isAttachment && (
            <div className={cx('step-meta')}>
              <span className={cx('step-attachment-info')}>
                <span className={cx('step-attachment-type')}>{item.binaryContent.contentType || 'image/png'}</span>
              </span>
            </div>
          )}
          
          {(!isAttachment) && duration > 0 && (
            <div className={cx('step-duration', 'step-meta')}>
                <div className={cx('duration-icon')}>{Parser(ArrowReturnIcon)}</div>
                {formatDuration(duration)}
            </div>
          )}
        </div>
        
        {/* Render children if expanded */}
        {hasContent && !collapsed && item.children && item.children.length > 0 && (
          item.children.map((child, childIndex) => this.renderStep(child, childIndex))
        )}
      </Fragment>
    );
  };

  render() {
    const { stepsTree, loading } = this.state;

    return (
      <div className={cx('test-body')}>
        <div className={cx('test-body-title')}>
          <div className={cx('play-icon')}>
            {Parser(PlayIcon)}
          </div>
          Test body
          <span className={cx('count-badge')}>{stepsTree.length}</span>
          
          <div className={cx('allure-buttons')}>
            <button className={cx('allure-btn', 'active')}>All Logs Tree</button>
          </div>
        </div>
        
        <div className={cx('step-list')}>
          {loading ? (
             <div style={{ padding: '20px' }}><SpinningPreloader /></div>
          ) : (
            stepsTree.map((item, i) => this.renderStep(item, i))
          )}
        </div>
      </div>
    );
  }
}
