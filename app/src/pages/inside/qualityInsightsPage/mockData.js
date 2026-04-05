import {
  ALERTS_SECTION,
  CLUSTER_VIEW_SECTION,
  DURATION_SECTION,
  FAILURE_CARD_SECTION,
  FAILURE_SEARCH_SECTION,
  FLAKINESS_SECTION,
  ML_ANALYSER_SECTION,
  QUICK_SUMMARY_SECTION,
  RELEASES_SECTION,
  TRENDS_SECTION,
} from './constants';

export const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { id: QUICK_SUMMARY_SECTION, label: 'Quick summary', accent: 'neutral' },
      { id: RELEASES_SECTION, label: 'Releases', accent: 'neutral' },
    ],
  },
  {
    title: 'Failure analysis',
    items: [
      { id: CLUSTER_VIEW_SECTION, label: 'Cluster view', accent: 'danger', badge: 'New' },
      { id: FAILURE_CARD_SECTION, label: 'Failure card', accent: 'danger', badge: 'New' },
      { id: ML_ANALYSER_SECTION, label: 'ML analyser', accent: 'danger', badge: 'New' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: FLAKINESS_SECTION, label: 'Flakiness', accent: 'success', badge: 'New' },
      { id: TRENDS_SECTION, label: 'Trends', accent: 'success', badge: 'New' },
      { id: DURATION_SECTION, label: 'Duration', accent: 'warning', badge: 'New' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: FAILURE_SEARCH_SECTION, label: 'Failure search', accent: 'success', badge: 'New' },
      { id: ALERTS_SECTION, label: 'Alerts', accent: 'warning', badge: 'New' },
    ],
  },
];

export const sectionTitles = {
  [QUICK_SUMMARY_SECTION]: 'Quick summary',
  [RELEASES_SECTION]: 'Releases',
  [CLUSTER_VIEW_SECTION]: 'Cluster view',
  [FAILURE_CARD_SECTION]: 'Smart failure card',
  [ML_ANALYSER_SECTION]: 'ML analyser',
  [FLAKINESS_SECTION]: 'Flakiness report',
  [TRENDS_SECTION]: 'Pass rate trends',
  [DURATION_SECTION]: 'Duration trends',
  [FAILURE_SEARCH_SECTION]: 'Failure search',
  [ALERTS_SECTION]: 'Alerts',
};