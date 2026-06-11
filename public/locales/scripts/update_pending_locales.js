const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];

const newKeys = {
  en: {
    auth: {
      pending: {
        accountApproved: "Account Approved!",
        applicationUnderReview: "Application Under Review",
        accountApprovedDesc: "Your account has been approved! You are ready to join and start creating courses.",
        applicationUnderReviewDesc: "Your information has been forwarded to the admin. You will be able to use the platform once your account is approved.",
        goToDashboard: "Go to Dashboard",
        wantToUseDifferentAccount: "Want to use a different account?",
        signOut: "Sign out"
      }
    }
  },
  de: {
    auth: {
      pending: {
        accountApproved: "Konto genehmigt!",
        applicationUnderReview: "Antrag wird geprüft",
        accountApprovedDesc: "Ihr Konto wurde genehmigt! Sie können nun beitreten und mit der Erstellung von Kursen beginnen.",
        applicationUnderReviewDesc: "Ihre Informationen wurden an den Administrator weitergeleitet. Sie können die Plattform nutzen, sobald Ihr Konto genehmigt wurde.",
        goToDashboard: "Zum Dashboard gehen",
        wantToUseDifferentAccount: "Möchten Sie ein anderes Konto verwenden?",
        signOut: "Abmelden"
      }
    }
  },
  fr: {
    auth: {
      pending: {
        accountApproved: "Compte approuvé !",
        applicationUnderReview: "Candidature en cours d'examen",
        accountApprovedDesc: "Votre compte a été approuvé ! Vous êtes prêt à nous rejoindre et à commencer à créer des cours.",
        applicationUnderReviewDesc: "Vos informations ont été transmises à l'administrateur. Vous pourrez utiliser la plateforme une fois votre compte approuvé.",
        goToDashboard: "Aller au tableau de bord",
        wantToUseDifferentAccount: "Vous souhaitez utiliser un autre compte ?",
        signOut: "Se déconnecter"
      }
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.auth) data.auth = {};
  if (!data.auth.pending) data.auth.pending = {};

  Object.assign(data.auth.pending, newKeys[locale].auth.pending);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
