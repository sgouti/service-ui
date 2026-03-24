const fs = require('fs');
const path = require('path');
const file = 'app/src/pages/inside/qualityInsightsPage/qualityInsightsPage.jsx';
let code = fs.readFileSync(file, 'utf8');

const compDir = 'app/src/pages/inside/qualityInsightsPage/components';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir);

const extractComponent = (compName) => {
  const compRegex = new RegExp(`const ${compName} = \\([^=]+?=> \\{(.*?)\\};\\s*${compName}\\.propTypes = \\{.*?\\};(?:\\s*${compName}\\.defaultProps = \\{.*?\\};)?`, 's');
  const altRegex = new RegExp(`const ${compName} = \\([^=]+?=> \\((.*?)\\);\\s*${compName}\\.propTypes = \\{.*?\\};(?:\\s*${compName}\\.defaultProps = \\{.*?\\};)?`, 's');
  
  let match = code.match(compRegex) || code.match(altRegex);
  if (match) return match[0];
  return null;
};

const components = [
  'SummaryPage',
  'ReleasesPage',
  'ClusterViewPage',
  'FailureCardPage',
  'MlAnalyserPage',
  'FlakinessPage',
  'TrendsPage',
  'DurationPage',
  'FailureSearchPage',
  'AlertsPage'
];

let importsToAdd = [];

components.forEach(comp => {
  const compCode = extractComponent(comp);
  if (compCode) {
    const fileContent = `import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../qualityInsightsPage.scss';
import { ResourceLink, Badge, Button, MetricCard, Panel, MiniChart, ProgressBar, Sparkline, DonutRing, SectionHeader } from './shared';

const cx = classNames.bind(styles);

${compCode}

export default ${comp};
`;
    fs.writeFileSync(path.join(compDir, `${comp}.jsx`), fileContent);
    code = code.replace(compCode, '');
    importsToAdd.push(`import ${comp} from './components/${comp}';`);
  }
});

const sharedComps = ['Badge', 'Button', 'ResourceLink', 'MetricCard', 'Panel', 'MiniChart', 'ProgressBar', 'Sparkline', 'DonutRing', 'SectionHeader'];
let sharedCodeStr = `import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { NavLink } from 'redux-first-router-link';
import styles from '../qualityInsightsPage.scss';
import { PROJECT_LAUNCHES_PAGE, TEST_ITEM_PAGE } from 'controllers/pages';
import { ALL } from 'common/constants/reservedFilterIds';

const cx = classNames.bind(styles);

`;

const constRegexes = [
  /const toneToBadgeClass = \{[\s\S]*?\};/,
  /const toneToTextClass = \{[\s\S]*?\};/,
  /const progressToneClass = \{[\s\S]*?\};/,
  /const chartToneClass = \{[\s\S]*?\};/,
  /const sparkToneClass = \{[\s\S]*?\};/,
  /const tileAccentColor = \{[\s\S]*?\};/,
  /const launchFilterKey = 'filter\.cnt\.name';/,
  /const getLaunchesPageLink = [\s\S]*?\}\);/,
  /const getLaunchByIdLink = [\s\S]*?\}\);/
];

constRegexes.forEach(regex => {
  const match = code.match(regex);
  if (match) {
    sharedCodeStr += match[0] + '\n\n';
    code = code.replace(regex, '');
  }
});

let sharedExports = [];
sharedComps.forEach(comp => {
  const compCode = extractComponent(comp);
  if (compCode) {
    sharedCodeStr += compCode + '\n\n';
    code = code.replace(compCode, '');
    sharedExports.push(comp);
  }
});

sharedCodeStr += `export { ${sharedExports.join(', ')} };\n`;
fs.writeFileSync(path.join(compDir, 'shared.jsx'), sharedCodeStr);

code = code.replace(/import styles from '\.\/qualityInsightsPage\.scss';/, `import styles from './qualityInsightsPage.scss';\n${importsToAdd.join('\n')}`);

fs.writeFileSync(file, code);
console.log('Done splitting!');
