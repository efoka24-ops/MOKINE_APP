export default {
  // Navigation
  nav: { dashboard: 'Tableau de bord', animals: 'Mes animaux', consultations: 'Consultations', marketplace: 'Boutique', notifications: 'Notifications', settings: 'Paramètres', logout: 'Déconnexion', forum: 'Forum', iot: 'Capteurs IoT', ai_diagnostic: 'Diagnostic IA' },
  // Auth
  auth: { login: 'Connexion', register: 'Inscription', phone: 'Numéro de téléphone', email: 'Email', password: 'Mot de passe', name: 'Nom complet', send_otp: 'Recevoir le code SMS', verify_otp: 'Vérifier le code', otp_placeholder: 'Code à 6 chiffres', login_sms: 'Connexion par SMS', login_email: 'Connexion par email', farmer: 'Éleveur', veterinarian: 'Vétérinaire', vendor: 'Vendeur' },
  // Dashboard
  dashboard: { title: 'Tableau de bord', welcome: 'Bienvenue', animals: 'Animaux', consultations: 'Consultations', alerts: 'Alertes', orders: 'Commandes', add_animal: 'Ajouter un animal', request_consultation: 'Demander une consultation', view_all: 'Voir tout', healthy: 'Sain', sick: 'Malade', treatment: 'Traitement' },
  // Animals
  animals: { title: 'Gestion du cheptel', add: 'Ajouter un animal', name: 'Nom', type: 'Espèce', breed: 'Race', age: 'Âge', weight: 'Poids (kg)', status: 'Statut santé', photo: 'Photo', vaccinations: 'Vaccinations', health_history: 'Historique santé', cattle: 'Bovin', sheep: 'Ovin', goat: 'Caprin', poultry: 'Volaille', horse: 'Équidé', pig: 'Porcin', camel: 'Camélidé' },
  // Consultation
  consultation: { title: 'Consultation vétérinaire', new: 'Nouvelle consultation', subject: 'Motif de consultation', symptoms: 'Symptômes observés', send: 'Envoyer', type_message: 'Tapez votre message...', accept: 'Accepter', refuse: 'Refuser', close: 'Terminer', prescription: 'Ordonnance', urgent: 'URGENT', normal: 'Normal', pending: 'En attente', active: 'En cours', closed: 'Terminée' },
  // Marketplace
  marketplace: { title: 'Boutique vétérinaire', search: 'Rechercher un produit', add_to_cart: 'Ajouter au panier', order: 'Commander', pay: 'Payer', payment_method: 'Mode de paiement', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', moov_money: 'Moov Money', delivery: 'Livraison', pickup: 'Retrait', stock: 'Stock disponible', category: { vaccine: 'Vaccins', medicine: 'Médicaments', antiparasitic: 'Antiparasitaires', nutrition: 'Nutrition', equipment: 'Matériel' } },
  // AI Diagnostic (Tebe)
  tebe: { title: 'Diagnostic Tebe IA', subtitle: 'Analyse visuelle alimentée par l\'intelligence artificielle', upload_photo: 'Prendre ou choisir une photo', upload_video: 'Enregistrer une vidéo', analyze: 'Analyser', analyzing: 'Analyse en cours...', result: 'Résultat du diagnostic', confidence: 'Fiabilité', severity: { none: 'Normal', low: 'Léger', medium: 'Modéré', high: 'Sérieux', critical: 'CRITIQUE' }, consult_vet: 'Consulter un vétérinaire', auto_care: 'Auto-soin possible', disclaimer: 'Ce diagnostic est indicatif. Consultez un vétérinaire pour confirmation.' },
  // IoT
  iot: { title: 'Capteurs & Colliers IoT', devices: 'Dispositifs', online: 'En ligne', offline: 'Hors ligne', battery: 'Batterie', temperature: 'Température', activity: 'Activité', alerts: 'Alertes capteurs', normal: 'Normal', alert: 'Alerte', register_device: 'Enregistrer un dispositif' },
  // Offline
  offline: { offline: 'Hors ligne', syncing: 'Synchronisation...', synced: 'Synchronisé', pending_actions: 'Actions en attente: {{count}}' },
  // Common
  common: { save: 'Enregistrer', cancel: 'Annuler', confirm: 'Confirmer', delete: 'Supprimer', edit: 'Modifier', loading: 'Chargement...', error: 'Erreur', success: 'Succès', close: 'Fermer', back: 'Retour', next: 'Suivant', yes: 'Oui', no: 'Non', search: 'Rechercher', filter: 'Filtrer', date: 'Date', actions: 'Actions', details: 'Détails', required: 'Requis' },
  // Page d'accueil
  home: {
    nav: { home: 'Accueil', about: 'À propos', solution: 'Solution', why: 'Pourquoi', contact: 'Contact', login: 'Se connecter' },
    hero: {
      subtitle: 'La Mokine Box centralise toutes les données de vos animaux et les transmet directement sur votre application, même en zone reculée.',
      btn_order: 'Commander', btn_lab: 'MokineLab',
      slide1: 'Mokine box : votre ferme connectée en temps réel',
      slide2: 'Mokine collar : un collier, milles informations',
      slide3: 'Mokine app : votre troupeau dans votre poche',
    },
    content: {
      about_title: 'À propos de Mokine',
      about_story_title: "D'Aboubakar à Mokine : une solution née du terrain",
      about_story: "Après la perte d'une grande partie de son troupeau, Aboubakar a mis en lumière le besoin d'un suivi vétérinaire accessible. C'est ainsi qu'est née Mokine, une solution qui allie technologie et expertise pour protéger les animaux et soutenir les éleveurs.",
      mission_label: 'Mission', mission: "Faciliter l'accès à des soins vétérinaires intelligents pour tous les éleveurs, même dans les zones à faible accès aux services.",
      vision_label: 'Vision', vision: "Devenir le numéro un en télémédicine vétérinaire au Cameroun.",
      values_label: 'Valeurs', values: "Innovation, accessibilité, fiabilité, proximité avec les utilisateurs, durabilité…",
      learn_more: 'En savoir plus',
      solution_title: 'Notre solution',
      solution_text: "Mokine combine technologie et expertise vétérinaire pour offrir aux éleveurs un suivi simple, fiable et accessible. Notre solution repose sur trois outils complémentaires qui travaillent ensemble pour protéger chaque troupeau.",
      collar_desc: "Le collier connecté qui surveille en continu les données vitales de chaque animal. Véritable sentinelle, il détecte les premiers signes de maladies invisibles à l'œil nu.",
      heart_rate: 'Fréquence cardiaque', temperature: 'Température', geolocation: 'Géolocalisation', activity: 'Activité',
      order_btn: 'Commander',
      app_desc: "Une application simple qui centralise le suivi du troupeau, envoie les alertes et connecte directement aux vétérinaires accessibles partout même en zone rurale.",
      app_feat1: 'Carnet de suivi sanitaire', app_feat2: 'Multilingue', app_feat3: 'Chat avec vétérinaire', app_feat4: 'Carte intégrée',
      ia_desc1: "Mokine IA analyse en temps réel les données des colliers et les médias envoyés par l'éleveur, fournit un prédiagnostic rapide, alerte en cas de risque et propose des actions concrètes.",
      ia_desc2: "Testez notre IA dès maintenant : gratuite avec la Mokine Box, ou par abonnement avec une semaine d'essai offerte.",
      discover_lab: 'Découvrir MokineLab',
      demo_title: 'Découvrez Mokine en action',
      demo_p1: "Avec Mokine, l'éleveur surveille ses bêtes en temps réel, reçoit des alertes précises et bénéficie d'un prédiagnostic grâce à l'IA.",
      demo_p2: "Découvrez à travers cette démo comment notre solution transforme la santé animale et protège les troupeaux.",
      order_now: 'Commander maintenant',
      why_title: 'Pourquoi choisir MOKINE ?',
      why: [
        { title: 'Suivi en temps réel', text: 'Surveillance continue pour chaque animal.' },
        { title: 'Alertes intelligentes', text: "Notifications précoces en cas d'anomalies." },
        { title: 'Prédictions par IA', text: 'Analyse pour anticiper les maladies.' },
        { title: 'Carnet de santé digital', text: 'Historique & traitements.' },
        { title: 'Conseils vétérinaires', text: 'Accès à des recommandations pratiques.' },
        { title: 'Statistiques & rapports', text: 'Décisions basées sur des données.' },
      ],
      steps_title: 'Le parcours Mokine en 5 étapes',
      steps: [
        { title: 'Commander la Mokine Box', text: 'Recevez votre Mokine Box contenant le collier connecté.' },
        { title: "Installer le collier sur l'animal", text: "Fixez le collier sur l'animal pour un suivi en continu." },
        { title: "S'inscrire sur l'app", text: "Créez votre compte sur l'application mobile ou web." },
        { title: "L'IA analyse et propose un pré-diagnostic", text: "L'IA analyse les données et vous donne un diagnostic en temps réel." },
        { title: 'Contacter un vétérinaire si besoin', text: 'Contactez un vétérinaire en un clic si nécessaire.' },
      ],
      faq_title: 'FAQ',
      faq: [
        { q: 'Comment fonctionne la Mokine Box ?', a: "Elle collecte les données vitales de vos animaux et les transmet à l'application mobile." },
        { q: "L'IA peut-elle remplacer un vétérinaire ?", a: "Non, elle propose un prédiagnostic et des conseils, mais un vétérinaire reste indispensable." },
        { q: 'Puis-je utiliser Mokine hors ligne ?', a: 'Oui, certaines fonctionnalités sont disponibles même sans connexion internet.' },
        { q: 'Quels sont les coûts associés ?', a: "La Mokine Box est disponible à l'achat et l'IA par abonnement flexible." },
      ],
      partner_label: 'Partenaire Officiel',
      footer_tagline: 'Connectez vos bovins. Surveillez leur santé. Optimisez votre élevage.',
    },
    contact: { title: 'Informations', address_label: 'Adresse', phone_label: 'Téléphone', email_label: 'Email', form_title: 'Envoyez-nous un message', name: 'Nom', email: 'Email', subject: 'Sujet', message: 'Votre message', send: 'Envoyer', sending: 'Envoi en cours...', success: '✅ Message envoyé avec succès !', error: "❌ Erreur lors de l'envoi. Réessayez." },
    footer: { rights: 'Tous droits réservés.', links: 'Liens', products: 'Nos produits', about_link: 'À propos', features_link: 'Fonctionnalités', faq_link: 'FAQ' },
  }
};
