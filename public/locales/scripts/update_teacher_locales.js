const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'fr'];
const newKeys = {
  en: {
    admin: {
      manageTeachers: "Manage Teachers",
      reviewTeacherApps: "Review and approve teacher applications",
      pendingTab: "Pending",
      approvedTab: "Approved",
      searchTeachers: "Search teachers...",
      loadingTeachers: "Loading teachers...",
      noPendingApps: "No Pending Applications",
      allCaughtUp: "All caught up! There are no teachers waiting for approval.",
      unnamedTeacher: "Unnamed Teacher",
      approveBtn: "Approve",
      questionnaireAnswers: "Questionnaire Answers",
      teachingExperience: "Teaching Experience",
      videoProficiency: "Video Proficiency",
      audienceSize: "Audience Size",
      noApprovedTeachers: "No Approved Teachers Found",
      teacherProfile: "Teacher Profile",
      contact: "Contact",
      status: "Status"
    },
    teacher: {
      nav: {
        dashboard: "Dashboard",
        manageCourses: "Manage Courses",
        trainingPlans: "Training Plans",
        manageUsers: "Manage Users",
        account: "Account"
      },
      dashboard: {
        welcomeTeacher: "Welcome back, {{name}}!",
        heresWhatHappening: "Here's what's happening with your courses.",
        totalStudents: "Total Students",
        studentsInYourCourses: "across your courses",
        totalCourses: "Total Courses",
        coursesCreated: "created by you",
        totalPlans: "Training Plans",
        plansCreated: "curriculums created",
        recentCourses: "Recent Courses",
        viewAll: "View all",
        noRecentCourses: "No recent courses",
        createYourFirstCourse: "Create your first course to get started",
        createCourseBtn: "Create Course",
        coursePopularity: "Course Popularity Heatmap",
        noDataToDisplay: "No data to display yet",
        createCoursesToSeeAnalytics: "Create courses and enroll students to see analytics"
      },
      courses: {
        manageCourses: "Manage Courses",
        manageCoursesSubtitle: "Create and manage your educational content",
        newCourse: "New Course",
        searchCourses: "Search your courses...",
        noCoursesFound: "No courses found",
        noCoursesDesc: "Get started by creating your first course",
        courseInfo: "Course Info",
        price: "Price",
        students: "Students",
        actions: "Actions",
        edit: "Edit",
        delete: "Delete",
        preview: "Preview",
        free: "Free",
        draft: "Draft",
        published: "Published",
        deleteCourseConfirm: "Are you sure you want to delete this course?",
        itemsPerPage: "Items per page",
        listView: "List View",
        gridView: "Grid View"
      },
      users: {
        manageStudents: "Manage Students",
        manageStudentsSubtitle: "View and manage students enrolled in your courses",
        searchStudents: "Search students...",
        loadingStudents: "Loading students...",
        noStudentsFound: "No students found",
        noStudentsDesc: "When students enroll in your courses, they will appear here",
        studentProfile: "Student Profile",
        enrolledCourses: "Enrolled Courses",
        joinDate: "Join Date",
        viewDetails: "View Details",
        itemsPerPage: "Items per page"
      },
      account: {
        accountSettings: "Account Settings",
        accountSettingsSubtitle: "Manage your profile and preferences",
        profileInfo: "Profile Information",
        updatePhoto: "Update Photo",
        fullName: "Full Name",
        emailAddress: "Email Address",
        phoneNumber: "Phone Number",
        saveChanges: "Save Changes",
        saving: "Saving...",
        profileUpdated: "Profile updated successfully",
        uploadError: "Failed to upload image"
      }
    }
  },
  de: {
    admin: {
      manageTeachers: "Lehrer verwalten",
      reviewTeacherApps: "Lehrerbewerbungen prüfen und genehmigen",
      pendingTab: "Ausstehend",
      approvedTab: "Genehmigt",
      searchTeachers: "Lehrer suchen...",
      loadingTeachers: "Lehrer werden geladen...",
      noPendingApps: "Keine ausstehenden Bewerbungen",
      allCaughtUp: "Alles erledigt! Es warten keine Lehrer auf Genehmigung.",
      unnamedTeacher: "Unbenannter Lehrer",
      approveBtn: "Genehmigen",
      questionnaireAnswers: "Fragebogen-Antworten",
      teachingExperience: "Unterrichtserfahrung",
      videoProficiency: "Videokenntnisse",
      audienceSize: "Publikumsgröße",
      noApprovedTeachers: "Keine genehmigten Lehrer gefunden",
      teacherProfile: "Lehrerprofil",
      contact: "Kontakt",
      status: "Status"
    },
    teacher: {
      nav: {
        dashboard: "Dashboard",
        manageCourses: "Kurse verwalten",
        trainingPlans: "Trainingspläne",
        manageUsers: "Benutzer verwalten",
        account: "Konto"
      },
      dashboard: {
        welcomeTeacher: "Willkommen zurück, {{name}}!",
        heresWhatHappening: "Das passiert in Ihren Kursen.",
        totalStudents: "Gesamtzahl Schüler",
        studentsInYourCourses: "in Ihren Kursen",
        totalCourses: "Gesamtzahl Kurse",
        coursesCreated: "von Ihnen erstellt",
        totalPlans: "Trainingspläne",
        plansCreated: "Lehrpläne erstellt",
        recentCourses: "Aktuelle Kurse",
        viewAll: "Alle ansehen",
        noRecentCourses: "Keine aktuellen Kurse",
        createYourFirstCourse: "Erstellen Sie Ihren ersten Kurs, um zu beginnen",
        createCourseBtn: "Kurs erstellen",
        coursePopularity: "Kursbeliebtheits-Heatmap",
        noDataToDisplay: "Noch keine Daten zum Anzeigen",
        createCoursesToSeeAnalytics: "Erstellen Sie Kurse und melden Sie Schüler an, um Analysen zu sehen"
      },
      courses: {
        manageCourses: "Kurse verwalten",
        manageCoursesSubtitle: "Erstellen und verwalten Sie Ihre Bildungsinhalte",
        newCourse: "Neuer Kurs",
        searchCourses: "Suchen Sie in Ihren Kursen...",
        noCoursesFound: "Keine Kurse gefunden",
        noCoursesDesc: "Beginnen Sie, indem Sie Ihren ersten Kurs erstellen",
        courseInfo: "Kursinfo",
        price: "Preis",
        students: "Schüler",
        actions: "Aktionen",
        edit: "Bearbeiten",
        delete: "Löschen",
        preview: "Vorschau",
        free: "Kostenlos",
        draft: "Entwurf",
        published: "Veröffentlicht",
        deleteCourseConfirm: "Möchten Sie diesen Kurs wirklich löschen?",
        itemsPerPage: "Elemente pro Seite",
        listView: "Listenansicht",
        gridView: "Rasteransicht"
      },
      users: {
        manageStudents: "Schüler verwalten",
        manageStudentsSubtitle: "Schüler in Ihren Kursen anzeigen und verwalten",
        searchStudents: "Schüler suchen...",
        loadingStudents: "Schüler werden geladen...",
        noStudentsFound: "Keine Schüler gefunden",
        noStudentsDesc: "Wenn sich Schüler in Ihre Kurse einschreiben, erscheinen sie hier",
        studentProfile: "Schülerprofil",
        enrolledCourses: "Eingeschriebene Kurse",
        joinDate: "Beitrittsdatum",
        viewDetails: "Details ansehen",
        itemsPerPage: "Elemente pro Seite"
      },
      account: {
        accountSettings: "Kontoeinstellungen",
        accountSettingsSubtitle: "Profil und Einstellungen verwalten",
        profileInfo: "Profilinformationen",
        updatePhoto: "Foto aktualisieren",
        fullName: "Vollständiger Name",
        emailAddress: "E-Mail-Adresse",
        phoneNumber: "Telefonnummer",
        saveChanges: "Änderungen speichern",
        saving: "Speichern...",
        profileUpdated: "Profil erfolgreich aktualisiert",
        uploadError: "Bild konnte nicht hochgeladen werden"
      }
    }
  },
  fr: {
    admin: {
      manageTeachers: "Gérer les professeurs",
      reviewTeacherApps: "Examiner et approuver les candidatures d'enseignants",
      pendingTab: "En attente",
      approvedTab: "Approuvé",
      searchTeachers: "Rechercher des professeurs...",
      loadingTeachers: "Chargement des professeurs...",
      noPendingApps: "Aucune candidature en attente",
      allCaughtUp: "Tout est à jour ! Il n'y a aucun enseignant en attente d'approbation.",
      unnamedTeacher: "Professeur sans nom",
      approveBtn: "Approuver",
      questionnaireAnswers: "Réponses au questionnaire",
      teachingExperience: "Expérience d'enseignement",
      videoProficiency: "Maîtrise de la vidéo",
      audienceSize: "Taille de l'audience",
      noApprovedTeachers: "Aucun professeur approuvé trouvé",
      teacherProfile: "Profil du professeur",
      contact: "Contact",
      status: "Statut"
    },
    teacher: {
      nav: {
        dashboard: "Tableau de bord",
        manageCourses: "Gérer les cours",
        trainingPlans: "Plans de formation",
        manageUsers: "Gérer les utilisateurs",
        account: "Compte"
      },
      dashboard: {
        welcomeTeacher: "Bon retour, {{name}} !",
        heresWhatHappening: "Voici ce qui se passe avec vos cours.",
        totalStudents: "Total des étudiants",
        studentsInYourCourses: "dans vos cours",
        totalCourses: "Total des cours",
        coursesCreated: "créés par vous",
        totalPlans: "Plans de formation",
        plansCreated: "programmes créés",
        recentCourses: "Cours récents",
        viewAll: "Voir tout",
        noRecentCourses: "Aucun cours récent",
        createYourFirstCourse: "Créez votre premier cours pour commencer",
        createCourseBtn: "Créer un cours",
        coursePopularity: "Carte de popularité des cours",
        noDataToDisplay: "Aucune donnée à afficher pour le moment",
        createCoursesToSeeAnalytics: "Créez des cours et inscrivez des étudiants pour voir les analyses"
      },
      courses: {
        manageCourses: "Gérer les cours",
        manageCoursesSubtitle: "Créez et gérez votre contenu éducatif",
        newCourse: "Nouveau cours",
        searchCourses: "Recherchez vos cours...",
        noCoursesFound: "Aucun cours trouvé",
        noCoursesDesc: "Commencez par créer votre premier cours",
        courseInfo: "Infos sur le cours",
        price: "Prix",
        students: "Étudiants",
        actions: "Actions",
        edit: "Modifier",
        delete: "Supprimer",
        preview: "Aperçu",
        free: "Gratuit",
        draft: "Brouillon",
        published: "Publié",
        deleteCourseConfirm: "Êtes-vous sûr de vouloir supprimer ce cours ?",
        itemsPerPage: "Éléments par page",
        listView: "Vue liste",
        gridView: "Vue grille"
      },
      users: {
        manageStudents: "Gérer les étudiants",
        manageStudentsSubtitle: "Afficher et gérer les étudiants inscrits à vos cours",
        searchStudents: "Rechercher des étudiants...",
        loadingStudents: "Chargement des étudiants...",
        noStudentsFound: "Aucun étudiant trouvé",
        noStudentsDesc: "Lorsque des étudiants s'inscrivent à vos cours, ils apparaîtront ici",
        studentProfile: "Profil de l'étudiant",
        enrolledCourses: "Cours inscrits",
        joinDate: "Date d'inscription",
        viewDetails: "Voir les détails",
        itemsPerPage: "Éléments par page"
      },
      account: {
        accountSettings: "Paramètres du compte",
        accountSettingsSubtitle: "Gérez votre profil et vos préférences",
        profileInfo: "Informations du profil",
        updatePhoto: "Mettre à jour la photo",
        fullName: "Nom complet",
        emailAddress: "Adresse e-mail",
        phoneNumber: "Numéro de téléphone",
        saveChanges: "Enregistrer les modifications",
        saving: "Enregistrement...",
        profileUpdated: "Profil mis à jour avec succès",
        uploadError: "Échec du téléchargement de l'image"
      }
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(__dirname, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.admin) data.admin = {};
  if (!data.teacher) data.teacher = {};

  Object.assign(data.admin, newKeys[locale].admin);
  Object.assign(data.teacher, newKeys[locale].teacher);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${locale}`);
});
