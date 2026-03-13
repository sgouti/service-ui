/*
 * Copyright 2026 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import { defineMessages, injectIntl } from 'react-intl';
import { UserAvatar } from 'pages/inside/common/userAvatar';
import { getLogItemLinkSelector } from 'controllers/testItem';
import styles from './triageAgingHeatmap.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  empty: {
    id: 'TriageAgingHeatmap.empty',
    defaultMessage: 'All clear - no items in triage!',
  },
  breachSummary: {
    id: 'TriageAgingHeatmap.breachSummary',
    defaultMessage: '{count} items breaching SLA - assign now',
  },
  healthySummary: {
    id: 'TriageAgingHeatmap.healthySummary',
    defaultMessage: '{count} To Investigate items currently pending review',
  },
  selected: {
    id: 'TriageAgingHeatmap.selected',
    defaultMessage: '{label} items',
  },
  unassigned: {
    id: 'TriageAgingHeatmap.unassigned',
    defaultMessage: 'Unassigned',
  },
  openItem: {
    id: 'TriageAgingHeatmap.openItem',
    defaultMessage: 'Open item details',
  },
});

const REFRESH_INTERVAL = 5 * 60 * 1000;

@injectIntl
@connect(
  (state) => ({
    getLogItemLink: getLogItemLinkSelector(state),
  }),
  { navigate: (linkAction) => linkAction },
)
export class TriageAgingHeatmap extends Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    widget: PropTypes.object.isRequired,
    fetchWidget: PropTypes.func,
    isPreview: PropTypes.bool,
    getLogItemLink: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  };

  static defaultProps = {
    fetchWidget: null,
    isPreview: false,
  };

  state = {
    selectedBucket: null,
  };

  componentDidMount() {
    if (this.props.isPreview || !this.props.fetchWidget) {
      return;
    }
    this.refreshId = setInterval(() => {
      this.props.fetchWidget({}, true, false);
    }, REFRESH_INTERVAL);
  }

  componentWillUnmount() {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
  }

  onBucketClick = (bucketKey) => {
    this.setState(({ selectedBucket }) => ({
      selectedBucket: selectedBucket === bucketKey ? null : bucketKey,
    }));
  };

  onItemClick = (item) => {
    if (!item.path) {
      return;
    }
    this.props.navigate(this.props.getLogItemLink(item));
  };

  getBucketEntries = () => {
    const buckets = this.props.widget.content.buckets || {};
    return ['fresh', 'aging', 'stale', 'breach']
      .map((key) => [key, buckets[key]])
      .filter(([, value]) => value);
  };

  render() {
    const {
      intl: { formatMessage },
      widget,
    } = this.props;
    const bucketEntries = this.getBucketEntries();
    const totalToInvestigate = widget.content.totalToInvestigate || 0;
    const selectedBucket = this.state.selectedBucket;
    const maxCount = Math.max(...bucketEntries.map(([, bucket]) => bucket.count), 1);
    const breachCount = widget.content.buckets?.breach?.count || 0;

    if (totalToInvestigate === 0) {
      return <div className={cx('empty-state')}>{formatMessage(messages.empty)}</div>;
    }

    const selectedItems = selectedBucket ? widget.content.buckets[selectedBucket]?.items || [] : [];

    return (
      <div className={cx('triage-aging-heatmap')}>
        {bucketEntries.map(([key, bucket]) => {
          const ratio = `${Math.max((bucket.count / maxCount) * 100, bucket.count ? 8 : 0)}%`;
          return (
            <button
              key={key}
              type="button"
              className={cx('bucket-button', key, { active: selectedBucket === key })}
              aria-label={`${bucket.label} bucket with ${bucket.count} items`}
              onClick={() => this.onBucketClick(key)}
            >
              <div className={cx('bucket-label')}>{bucket.label}</div>
              <div className={cx('bar-track')}>
                <div className={cx('bar-fill')} style={{ width: ratio }} />
              </div>
              <div className={cx('bucket-count')}>{bucket.count} items</div>
              <div className={cx('bucket-status')}>{key === 'breach' ? 'SLA' : 'OK'}</div>
            </button>
          );
        })}

        <div className={cx('summary', { alert: breachCount > 0 })}>
          {breachCount > 0
            ? formatMessage(messages.breachSummary, { count: breachCount })
            : formatMessage(messages.healthySummary, { count: totalToInvestigate })}
        </div>

        {selectedBucket && (
          <div className={cx('items-panel')}>
            <div className={cx('items-heading')}>
              {formatMessage(messages.selected, {
                label: widget.content.buckets[selectedBucket].label,
              })}
            </div>
            <div className={cx('items-list')}>
              {selectedItems.map((item) => (
                <div key={item.itemId} className={cx('item-row')}>
                  {item.analysisOwnerId ? (
                    <div className={cx('assignee')}>
                      <UserAvatar thumbnail userId={item.analysisOwnerId} />
                    </div>
                  ) : (
                    <div className={cx('unassigned')}>{formatMessage(messages.unassigned)}</div>
                  )}
                  <div className={cx('item-main')}>
                    <button
                      type="button"
                      className={cx('item-link')}
                      aria-label={`${formatMessage(messages.openItem)}: ${item.name}`}
                      onClick={() => this.onItemClick(item)}
                    >
                      {item.name}
                    </button>
                    <div className={cx('item-meta')}>{item.ageHours}h in triage</div>
                  </div>
                  <div className={cx('item-meta')}>#{item.itemId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}