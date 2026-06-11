const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];

const newKeys = {
  en: {
    teacher: {
      account: {
        accountSettings: "Account Settings",
        manageProfile: "Manage your teacher profile and preferences",
        clickToUpdateAvatar: "Click to update avatar.",
        teachingProfileReadOnly: "Teaching Profile (Read Only)",
        teachingExperience: "Teaching Experience",
        videoProficiency: "Video Proficiency",
        audienceSize: "Audience Size"
      }
    }
  },
  de: {
    teacher: {
      account: {
        accountSettings: "Kontoeinstellungen",
        manageProfile: "Verwalten Sie Ihr Lehrerprofil und Ihre Einstellungen",
        clickToUpdateAvatar: "Klicken Sie, um den Avatar zu aktualisieren.",
        teachingProfileReadOnly: "Lehrerprofil (Schreibgeschützt)",
        teachingExperience: "Unterrichtserfahrung",
        videoProficiency: "Videokenntnisse",
        audienceSize: "Publikumsgröße"
      }
    }
  },
  fr: {
    teacher: {
      account: {
        accountSettings: "Paramètres du compte",
        manageProfile: "Gérez votre profil d'enseignant et vos préférences",
        clickToUpdateAvatar: "Cliquez pour mettre à jour l'avatar.",
        teachingProfileReadOnly: "Profil d'enseignement (Lecture seule)",
        teachingExperience: "Expérience d'enseignement",
        videoProficiency: "Maîtrise de la vidéo",
        audienceSize: "Taille de l'audience"
      }
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.teacher) data.teacher = {};
  if (!data.teacher.account) data.teacher.account = {};

  Object.assign(data.teacher.account, newKeys[locale].teacher.account);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
