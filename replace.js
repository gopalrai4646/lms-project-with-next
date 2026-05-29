const fs = require('fs');

const map = {
  'text-h1': '${TYPOGRAPHY.h1}',
  'text-body': '${TYPOGRAPHY.body}',
  'text-h2': '${TYPOGRAPHY.h2}',
  'text-h3': '${TYPOGRAPHY.h3}',
  'text-label': '${TYPOGRAPHY.label}',
  'text-metric': '${TYPOGRAPHY.metric}',
  'page-container': '${UI_COMPONENTS.pageContainer}',
  'card-header': '${UI_COMPONENTS.cardHeader}',
  'card-interactive': '${UI_COMPONENTS.cardInteractive}',
  'card': '${UI_COMPONENTS.card}',
  'badge': '${UI_COMPONENTS.badge}',
  'list-row': '${UI_COMPONENTS.listRow}',
  'progress-track': '${UI_COMPONENTS.progressTrack}',
  'progress-fill': '${UI_COMPONENTS.progressFill}',
  'segmented-control': '${UI_COMPONENTS.segmentedControl}',
  'segmented-item-active': '${UI_COMPONENTS.segmentedItemActive}',
  'segmented-item': '${UI_COMPONENTS.segmentedItem}',
  'input-field': '${UI_COMPONENTS.input}',
  'btn-primary': '${BUTTONS.primary}',
  'btn-secondary': '${BUTTONS.secondary}',
  'btn-ghost': '${BUTTONS.ghost}',
  'btn-danger': '${BUTTONS.danger}'
};

function safeReplace(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add imports
  if (!content.includes('import { TYPOGRAPHY')) {
    content = content.replace(/import .*?from 'lucide-react';[\s\S]*?(?=\n\n|\nexport|\nconst)/, match => match + '\nimport { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from \'@/constants/ui\';');
  }

  // 1. Replace exact string className="class1 class2" -> className={`...`}
  content = content.replace(/className=\"([^\"]+)\"/g, (match, classes) => {
    let replaced = false;
    let parts = classes.split(' ');
    let newParts = parts.map(p => {
      let clean = p.replace('!', '');
      if (map[clean]) {
        replaced = true;
        return map[clean];
      }
      return p;
    });
    if (replaced) {
      return 'className={`' + newParts.join(' ') + '`}';
    }
    return match;
  });

  // 2. Replace inside existing template literals: className={`class1 ${foo}`}
  content = content.replace(/className=\{\`([^\`]+)\`\}/g, (match, classesStr) => {
    let parts = classesStr.split(/(\$\{[^\}]+\})/);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('${')) {
        let words = parts[i].split(' ');
        words = words.map(w => {
          let clean = w.replace('!', '');
          if (map[clean]) {
            return map[clean];
          }
          return w;
        });
        parts[i] = words.join(' ');
      }
    }
    return 'className={`' + parts.join('') + '`}';
  });

  fs.writeFileSync(file, content);
}

safeReplace('src/app/(admin)/admin/page.tsx');
safeReplace('src/app/(admin)/admin/courses/page.tsx');
