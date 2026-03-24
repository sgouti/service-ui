import PropTypes from 'prop-types';
import { Layout } from 'layouts/common/layout';
import { AppHeader } from 'layouts/appLayout/appHeader';
import { AppBanner } from 'layouts/appLayout/appBanner';
import { QualityInsightsSidebar } from './qualityInsightsSidebar/qualityInsightsSidebar';

export const QualityInsightsLayout = ({ children, rawContent }) => (
  <Layout
    Header={AppHeader}
    Sidebar={QualityInsightsSidebar}
    Banner={AppBanner}
    rawContent={rawContent}
    sidebarWidth={'232px'}
    sidebarMobileWidth={'232px'}
    showCornerArea={false}
  >
    {children}
  </Layout>
);

QualityInsightsLayout.propTypes = {
  children: PropTypes.node,
  rawContent: PropTypes.bool,
};

QualityInsightsLayout.defaultProps = {
  children: null,
  rawContent: false,
};