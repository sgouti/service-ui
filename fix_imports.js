const fs = require('fs');
const path = require('path');
const dir = 'app/src/pages/inside/qualityInsightsPage/components';

const files = fs.readdirSync(dir).filter(f => f !== 'ui.jsx' && f !== 'shared.jsx' && f.endsWith('.jsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const constantsUsed = [];
  const constantsToCheck = ['CLUSTER_VIEW_SECTION', 'ML_ANALYSER_SECTION', 'FLAKINESS_SECTION', 'TRENDS_SECTION', 'DURATION_SECTION', 'QUICK_SUMMARY_SECTION', 'FAILURE_CARD_SECTION'];
  
  constantsToCheck.forEach(c => {
    if (content.includes(c) && !content.includes(`import { ${c}`) && !content.includes(`${c} } from`)) {
      constantsUsed.push(c);
    }
  });

  if (constantsUsed.length > 0) {
    content = content.replace(/import styles from '\.\.\/qualityInsightsPage\.scss';/, `import styles from '../qualityInsightsPage.scss';\nimport { ${constantsUsed.join(', ')} } from '../constants';`);
    changed = true;
  }

  if (content.includes('resolveLaunchName') && !content.includes('resolveLaunchName, ResourceLink')) {
    content = content.replace(/import { ResourceLink,/, 'import { resolveLaunchName, ResourceLink,');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', f);
  }
});
