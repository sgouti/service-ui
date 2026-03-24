import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import { NavLink } from 'redux-first-router-link';
import { availableProjectsSelector } from 'controllers/user';
import {
  LAUNCHES_PAGE,
  PROJECT_QUALITY_INSIGHTS_PAGE,
  payloadSelector,
  projectIdSelector,
} from 'controllers/pages';
import {
  DEFAULT_QUALITY_INSIGHTS_SECTION,
  QUALITY_INSIGHTS_SECTIONS,
} from 'pages/inside/qualityInsightsPage/constants';
import { navigationGroups } from 'pages/inside/qualityInsightsPage/mockData';
import styles from './qualityInsightsSidebar.scss';

const cx = classNames.bind(styles);

const getSectionLink = (projectId, insightSection) => ({
  type: PROJECT_QUALITY_INSIGHTS_PAGE,
  payload: {
    projectId,
    insightSection,
  },
});

const QualityInsightsSidebarComponent = ({
  activeSection,
  projectId,
  projects,
  onClickNavBtn,
}) => {
  const [projectsOpen, setProjectsOpen] = React.useState(false);
  const projectMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
        setProjectsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setProjectsOpen(false);
  }, [projectId]);

  return (
    <aside className={cx('sidebar')}>
      <div className={cx('sidebar-logo')}>
        <div className={cx('sidebar-mark')}>RP</div>
        <div className={cx('sidebar-brand')}>ReportPortal</div>
      </div>
      <div className={cx('sidebar-utility-row')}>
        <NavLink
          to={{ type: LAUNCHES_PAGE, payload: { projectId } }}
          className={cx('back-link')}
          onClick={onClickNavBtn}
        >
          <span className={cx('back-link-arrow')}>‹</span>
          <span>Back to project</span>
        </NavLink>
      </div>
      <div className={cx('project-box')} ref={projectMenuRef}>
        <div className={cx('project-label')}>Project</div>
        <button
          type={'button'}
          className={cx('project-trigger')}
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <span className={cx('project-name')}>{projectId || 'superadmin_personal'}</span>
          <span className={cx('project-chevron', { 'project-chevron-open': projectsOpen })}>▾</span>
        </button>
        {projectsOpen ? (
          <div className={cx('projects-list')}>
            {projects.map((project) => (
              <NavLink
                key={project}
                to={getSectionLink(project, activeSection)}
                className={cx('project-list-item')}
                activeClassName={cx('project-list-item-active')}
                isActive={() => projectId === project}
                onClick={() => {
                  setProjectsOpen(false);
                  onClickNavBtn();
                }}
              >
                {project}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
      <div className={cx('sidebar-title')}>Quality insights</div>
      <div className={cx('groups')}>
        {navigationGroups.map((group) => (
          <div key={group.title} className={cx('group')}>
            <div className={cx('group-title')}>{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={getSectionLink(projectId, item.id)}
                className={cx('nav-link')}
                activeClassName={cx('nav-link-active')}
                isActive={() => activeSection === item.id}
                onClick={onClickNavBtn}
              >
                <span className={cx('nav-dot', `nav-dot-${item.accent}`)} />
                <span className={cx('nav-label')}>{item.label}</span>
                {item.badge ? <span className={cx('nav-badge')}>{item.badge}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
};

QualityInsightsSidebarComponent.propTypes = {
  activeSection: PropTypes.string,
  projectId: PropTypes.string,
  projects: PropTypes.arrayOf(PropTypes.string),
  onClickNavBtn: PropTypes.func,
};

QualityInsightsSidebarComponent.defaultProps = {
  activeSection: DEFAULT_QUALITY_INSIGHTS_SECTION,
  projectId: 'superadmin_personal',
  projects: [],
  onClickNavBtn: () => {},
};

export const QualityInsightsSidebar = connect((state) => {
  const payload = payloadSelector(state);
  const activeSection = QUALITY_INSIGHTS_SECTIONS.includes(payload.insightSection)
    ? payload.insightSection
    : DEFAULT_QUALITY_INSIGHTS_SECTION;
  const availableProjects = Object.keys(availableProjectsSelector(state) || {});

  return {
    activeSection,
    projectId: projectIdSelector(state),
    projects: (availableProjects || []).sort(),
  };
})(QualityInsightsSidebarComponent);