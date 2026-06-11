const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];

const newKeys = {
  en: {
    auth: {
      teacherSignup: {
        teachingExperienceQuestion: "What kind of teaching have you done before?",
        experienceOptions: {
          "In person, informally": "In person, informally",
          "In person, professionally": "In person, professionally",
          "Online": "Online",
          "Other": "Other"
        },
        videoProQuestion: "How much of a video \"pro\" are you?",
        videoOptions: {
          "I am a beginner": "I am a beginner",
          "I have some knowledge": "I have some knowledge",
          "I am experienced": "I am experienced",
          "I have videos ready to upload": "I have videos ready to upload"
        },
        audienceQuestion: "Do you have an audience to share your course with?",
        audienceOptions: {
          "Not at the moment": "Not at the moment",
          "I have a small following": "I have a small following",
          "I have a sizeable following": "I have a sizeable following"
        },
        previous: "Previous",
        submit: "Submit",
        submitting: "Submitting..."
      }
    }
  },
  de: {
    auth: {
      teacherSignup: {
        teachingExperienceQuestion: "Welche Art von Unterricht haben Sie bisher gemacht?",
        experienceOptions: {
          "In person, informally": "Persönlich, informell",
          "In person, professionally": "Persönlich, professionell",
          "Online": "Online",
          "Other": "Andere"
        },
        videoProQuestion: "Wie sehr sind Sie ein Video-\"Profi\"?",
        videoOptions: {
          "I am a beginner": "Ich bin ein Anfänger",
          "I have some knowledge": "Ich habe etwas Wissen",
          "I am experienced": "Ich bin erfahren",
          "I have videos ready to upload": "Ich habe fertige Videos zum Hochladen"
        },
        audienceQuestion: "Haben Sie ein Publikum, mit dem Sie Ihren Kurs teilen können?",
        audienceOptions: {
          "Not at the moment": "Im Moment nicht",
          "I have a small following": "Ich habe eine kleine Anhängerschaft",
          "I have a sizeable following": "Ich habe eine beachtliche Anhängerschaft"
        },
        previous: "Zurück",
        submit: "Einreichen",
        submitting: "Einreichen..."
      }
    }
  },
  fr: {
    auth: {
      teacherSignup: {
        teachingExperienceQuestion: "Quel type d'enseignement avez-vous fait auparavant ?",
        experienceOptions: {
          "In person, informally": "En personne, de manière informelle",
          "In person, professionally": "En personne, de manière professionnelle",
          "Online": "En ligne",
          "Other": "Autre"
        },
        videoProQuestion: "Êtes-vous un \"pro\" de la vidéo ?",
        videoOptions: {
          "I am a beginner": "Je suis débutant",
          "I have some knowledge": "J'ai quelques connaissances",
          "I am experienced": "Je suis expérimenté",
          "I have videos ready to upload": "J'ai des vidéos prêtes à être téléchargées"
        },
        audienceQuestion: "Avez-vous un public avec qui partager votre cours ?",
        audienceOptions: {
          "Not at the moment": "Pas pour le moment",
          "I have a small following": "J'ai une petite audience",
          "I have a sizeable following": "J'ai une audience importante"
        },
        previous: "Précédent",
        submit: "Soumettre",
        submitting: "Soumission en cours..."
      }
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.auth) data.auth = {};
  if (!data.auth.teacherSignup) data.auth.teacherSignup = {};

  Object.assign(data.auth.teacherSignup, newKeys[locale].auth.teacherSignup);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
