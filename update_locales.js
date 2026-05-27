const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];
const newKeys = {
  en: {
    admin: {
      noCoursesAdded: "No courses added to the curriculum yet.",
      noMatchingCourses: "No matching courses found.",
      noRolesCreated: "No Roles Created Yet",
      noRoleDescription: "No description",
      noStaffMembers: "No Staff Members Yet",
      noReportsToShow: "No reports to show",
      noReportsDescription: "Your analytics dashboard is empty because there are no courses or training plans created yet.",
      noUsersFound: "No users found matching your criteria."
    },
    dashboard: {
      noCoursesInPlan: "No courses available in this plan yet.",
      stalledLearnersSub: "No activity in 7 days"
    }
  },
  de: {
    admin: {
      noCoursesAdded: "Noch keine Kurse zum Lehrplan hinzugefügt.",
      noMatchingCourses: "Keine passenden Kurse gefunden.",
      noRolesCreated: "Noch keine Rollen erstellt",
      noRoleDescription: "Keine Beschreibung",
      noStaffMembers: "Noch keine Mitarbeiter",
      noReportsToShow: "Keine Berichte anzuzeigen",
      noReportsDescription: "Ihr Analyse-Dashboard ist leer, da noch keine Kurse oder Trainingspläne erstellt wurden.",
      noUsersFound: "Keine Benutzer gefunden, die Ihren Kriterien entsprechen."
    },
    dashboard: {
      noCoursesInPlan: "Noch keine Kurse in diesem Plan verfügbar.",
      stalledLearnersSub: "Keine Aktivität in 7 Tagen"
    }
  },
  fr: {
    admin: {
      noCoursesAdded: "Aucun cours n'a encore été ajouté au programme.",
      noMatchingCourses: "Aucun cours correspondant trouvé.",
      noRolesCreated: "Aucun rôle créé pour le moment",
      noRoleDescription: "Pas de description",
      noStaffMembers: "Aucun membre du personnel pour le moment",
      noReportsToShow: "Aucun rapport à afficher",
      noReportsDescription: "Votre tableau de bord d'analyse est vide car aucun cours ou plan de formation n'a encore été créé.",
      noUsersFound: "Aucun utilisateur trouvé correspondant à vos critères."
    },
    dashboard: {
      noCoursesInPlan: "Aucun cours disponible dans ce plan pour le moment.",
      stalledLearnersSub: "Aucune activité en 7 jours"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.admin) data.admin = {};
  if (!data.dashboard) data.dashboard = {};

  Object.assign(data.admin, newKeys[locale].admin);
  Object.assign(data.dashboard, newKeys[locale].dashboard);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
