const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];

const newKeys = {
  en: {
    teacher: {
      nav: {
        assignedCourses: "Assigned Courses",
        assignedPlans: "Assigned Plans"
      }
    }
  },
  de: {
    teacher: {
      nav: {
        assignedCourses: "Zugewiesene Kurse",
        assignedPlans: "Zugewiesene Pläne"
      }
    }
  },
  fr: {
    teacher: {
      nav: {
        assignedCourses: "Cours attribués",
        assignedPlans: "Plans attribués"
      }
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `../${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.teacher) data.teacher = {};
  if (!data.teacher.nav) data.teacher.nav = {};

  Object.assign(data.teacher.nav, newKeys[locale].teacher.nav);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
