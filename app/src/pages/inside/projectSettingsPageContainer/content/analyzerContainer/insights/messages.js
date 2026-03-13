import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  tabDescription: {
    id: 'AnalyzerInsightsSettings.tabDescription',
    defaultMessage:
      'Control which analyzer insight surfaces are available in project workflows and the dedicated insights page.',
  },
  insightsPage: {
    id: 'AnalyzerInsightsSettings.insightsPage',
    defaultMessage: 'Analyzer Insights page',
  },
  insightsPageDescription: {
    id: 'AnalyzerInsightsSettings.insightsPageDescription',
    defaultMessage: 'Show the project-level Analyzer Insights navigation entry and page.',
  },
  flakinessBadge: {
    id: 'AnalyzerInsightsSettings.flakinessBadge',
    defaultMessage: 'Flakiness badge and detail panel',
  },
  flakinessBadgeDescription: {
    id: 'AnalyzerInsightsSettings.flakinessBadgeDescription',
    defaultMessage: 'Expose flakiness rates and drill-down history details for unstable items.',
  },
  quarantineTab: {
    id: 'AnalyzerInsightsSettings.quarantineTab',
    defaultMessage: 'Quarantine tab',
  },
  quarantineTabDescription: {
    id: 'AnalyzerInsightsSettings.quarantineTabDescription',
    defaultMessage: 'Show repeated status-switching candidates in the dedicated quarantine view.',
  },
  confidenceScore: {
    id: 'AnalyzerInsightsSettings.confidenceScore',
    defaultMessage: 'Confidence score indicator',
  },
  confidenceScoreDescription: {
    id: 'AnalyzerInsightsSettings.confidenceScoreDescription',
    defaultMessage: 'Expose confidence labels for ML suggestions in the defect decision modal.',
  },
  rankedSuggestions: {
    id: 'AnalyzerInsightsSettings.rankedSuggestions',
    defaultMessage: 'Ranked suggestions panel',
  },
  rankedSuggestionsDescription: {
    id: 'AnalyzerInsightsSettings.rankedSuggestionsDescription',
    defaultMessage: 'Show ranking position and richer scoring metadata for ML suggestions.',
  },
  rootCauseClusters: {
    id: 'AnalyzerInsightsSettings.rootCauseClusters',
    defaultMessage: 'Root-cause clusters',
  },
  rootCauseClustersDescription: {
    id: 'AnalyzerInsightsSettings.rootCauseClustersDescription',
    defaultMessage: 'Show unique error cluster summaries on the Analyzer Insights page.',
  },
  triageAging: {
    id: 'AnalyzerInsightsSettings.triageAging',
    defaultMessage: 'Triage aging heatmap',
  },
  triageAgingDescription: {
    id: 'AnalyzerInsightsSettings.triageAgingDescription',
    defaultMessage: 'Visualize aging non-passed items by age buckets.',
  },
  coverageKpi: {
    id: 'AnalyzerInsightsSettings.coverageKpi',
    defaultMessage: 'Coverage KPI',
  },
  coverageKpiDescription: {
    id: 'AnalyzerInsightsSettings.coverageKpiDescription',
    defaultMessage: 'Show analyzer coverage for non-passed items in the selected launch.',
  },
  releaseAggregate: {
    id: 'AnalyzerInsightsSettings.releaseAggregate',
    defaultMessage: 'Release aggregate',
  },
  releaseAggregateDescription: {
    id: 'AnalyzerInsightsSettings.releaseAggregateDescription',
    defaultMessage: 'Show recent launch history for the selected release name.',
  },
  launchComparison: {
    id: 'AnalyzerInsightsSettings.launchComparison',
    defaultMessage: 'Launch comparison diff',
  },
  launchComparisonDescription: {
    id: 'AnalyzerInsightsSettings.launchComparisonDescription',
    defaultMessage: 'Compare the selected launch against a recent baseline launch.',
  },
  hybridSearchIndicator: {
    id: 'AnalyzerInsightsSettings.hybridSearchIndicator',
    defaultMessage: 'Hybrid search indicator',
  },
  hybridSearchIndicatorDescription: {
    id: 'AnalyzerInsightsSettings.hybridSearchIndicatorDescription',
    defaultMessage: 'Show hybrid, semantic, and rerank hints in suggestion details.',
  },
});