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
    contact: { title: 'Informations', address_label: 'Adresse', phone_label: 'Téléphone', email_label: 'Email', form_title: 'Envoyez-nous un message', name: 'Nom', email: 'Email', subject: 'Sujet', message: 'Votre message', send: 'Envoyer', sending: 'Envoi en cours...', success: '✅ Message envoyé avec succès !', error: '❌ Erreur lors de l\'envoi. Réessayez.' },
    footer: { rights: 'Tous droits réservés.', links: 'Liens', products: 'Nos produits', about_link: 'À propos', features_link: 'Fonctionnalités', faq_link: 'FAQ' },
  }
};
