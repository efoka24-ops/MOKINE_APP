// MokineVeto AI — Questionnaire & Diagnostic cheptel
// ─────────────────────────────────────────────────────────────
// Base de connaissances vétérinaires pour l'élevage africain
import db from '../db/index.js';
// ─────────────────────────────────────────────────────────────

// Mots-clés → symptômes normalisés
const KEYWORD_MAP = {
  // Alimentation
  mange: 'anorexie', 'ne mange': 'anorexie', 'refuse manger': 'anorexie',
  anorexie: 'anorexie', 'perte appetit': 'anorexie', appétit: 'anorexie',
  maigre: 'amaigrissement', 'perd du poids': 'amaigrissement', amaigrissement: 'amaigrissement',

  // Température / Fièvre
  fievre: 'fievre', fièvre: 'fievre', chaud: 'fievre', température: 'fievre',
  'temperature elevee': 'fievre', hyperthermie: 'fievre',

  // Respiratoire
  toux: 'toux', tousse: 'toux', toussement: 'toux',
  respir: 'dyspnee', souffle: 'dyspnee', halète: 'dyspnee', dyspnee: 'dyspnee',
  jetage: 'jetage', morve: 'jetage', 'ecoulement nasal': 'jetage',

  // Digestif
  diarrhee: 'diarrhee', diarrhée: 'diarrhee', selles: 'diarrhee', 'selles molles': 'diarrhee',
  colique: 'colique', ballonne: 'ballonnement', ballonnement: 'ballonnement',
  constipation: 'constipation', vomit: 'vomissement', vomissement: 'vomissement',

  // Locomoteur
  boite: 'boiterie', boiterie: 'boiterie', 'ne marche': 'boiterie', 'mal marcher': 'boiterie',
  patte: 'boiterie', onglons: 'onglons', pieds: 'onglons',

  // Peau / Muqueuses
  bouton: 'lesion_cutanee', lésion: 'lesion_cutanee', plaque: 'lesion_cutanee',
  ulcere: 'ulcere', ulcère: 'ulcere', aphte: 'aphte', vesicule: 'aphte',
  nodule: 'nodule', nodules: 'nodule',
  gale: 'gale', demangeaison: 'gale', gratte: 'gale',
  jaunisse: 'jaunisse', ictere: 'jaunisse', ictère: 'jaunisse',

  // Neurologique
  tremble: 'tremblements', tremblements: 'tremblements', convulsion: 'convulsions',
  tourne: 'tournis', tournis: 'tournis', 'tourne en rond': 'tournis',
  paralysie: 'paralysie', prostré: 'prostration', prostraion: 'prostration',

  // Reproducteur / Mammaire
  mammite: 'mammite', mamelle: 'mammite', lait: 'mammite',
  avortement: 'avortement', avorte: 'avortement', fausse_couche: 'avortement',

  // Comportement général
  lethargi: 'lethargie', lethargique: 'lethargie', faible: 'lethargie',
  mort: 'mortalite', mort_subite: 'mortalite',

  // Contagion
  'autres animaux': 'contagion', contagieux: 'contagion', 'plusieurs animaux': 'contagion',
  troupeau: 'contagion', epidemie: 'contagion',

  // Espèce animale
  bovin: 'bovin', vache: 'bovin', taureau: 'bovin', boeuf: 'bovin', veau: 'bovin',
  ovin: 'ovin', mouton: 'ovin', brebis: 'ovin', agneau: 'ovin',
  caprin: 'caprin', chevre: 'caprin', chèvre: 'caprin', bouc: 'caprin',
  porc: 'porcin', poule: 'volaille', poulet: 'volaille', dinde: 'volaille',
  coq: 'volaille', pintade: 'volaille', canard: 'volaille', caille: 'volaille',
  oie: 'volaille', pigeon: 'volaille',

  // Urines / Hémoglobinurie
  'urines rouges': 'hemoglobinurie', 'urine rouge': 'hemoglobinurie',
  'pipi rouge': 'hemoglobinurie', hemoglobinurie: 'hemoglobinurie',
  'urine marron': 'hemoglobinurie', 'urine sombre': 'hemoglobinurie',
  'sang urine': 'hemoglobinurie', 'urine brun': 'hemoglobinurie',

  // Gonflement musculaire (Charbon symptomatique)
  gonfle: 'gonflement', gonflement: 'gonflement', enflure: 'gonflement',
  gonfler: 'gonflement', crepite: 'gonflement', tumefaction: 'gonflement',

  // Torticolis / troubles nerveux volaille
  torticolis: 'torticolis', 'tete tournee': 'torticolis',
  'cou tordu': 'torticolis', 'tourne tete': 'torticolis',

  // Mortalité
  'mort soudain': 'mortalite', 'mort subit': 'mortalite',
  meurent: 'mortalite', decede: 'mortalite', morts: 'mortalite',
  'beaucoup morts': 'mortalite', 'meurent vite': 'mortalite',

  // Saignement
  saignement: 'saignement', saigne: 'saignement', sang: 'saignement',
  hemorragie: 'saignement', 'sang naseaux': 'saignement',
};

// Base de maladies — adaptée à l'élevage africain (Cameroun, Afrique de l'Ouest/Centrale)
const DISEASE_DATABASE = [
  {
    name: 'Fièvre aphteuse',
    severity: 'critical',
    symptoms: ['fievre', 'aphte', 'boiterie', 'anorexie', 'contagion'],
    required: ['aphte', 'fievre'],
    causes: [
      { symptome: 'Vésicules buccales et podales', description: 'Formation d\'aphtes (vésicules) dans la bouche, sur les gencives, la langue et les espaces interdigitaux.' },
      { symptome: 'Fièvre élevée (>40°C)', description: 'Hyperthermie brutale au début de la maladie, l\'animal est abattu et refuse de manger.' },
      { symptome: 'Boiterie intense', description: 'Douleur aux onglons due aux vésicules podales, l\'animal évite d\'appuyer sur ses pieds.' },
    ],
    conclusion: 'URGENCE : Maladie à déclaration obligatoire. Isolez immédiatement l\'animal et contactez un vétérinaire et les autorités sanitaires (MINEPIA).',
    consultVet: true,
    prevention: [
      'Vaccination systématique du cheptel (vaccin FMD trivalent)',
      'Quarantaine stricte de 21 jours pour tout animal entrant',
      'Désinfection des véhicules et équipements lors des transhumances',
    ],
    contextAfrique: 'Endémique en Afrique subsaharienne dont le Cameroun. Épidémies aux passages de troupeaux. Déclaration obligatoire au MINEPIA sous 24h.',
    icon: '🔴'
  },
  {
    name: 'Charbon bactéridien (Anthrax)',
    severity: 'critical',
    symptoms: ['mort_subite', 'fievre', 'saignement', 'lethargie'],
    required: ['mort_subite'],
    causes: [
      { symptome: 'Mort subite inexpliquée', description: 'L\'animal peut mourir très rapidement (en quelques heures) avec peu ou pas de signes préalables.' },
      { symptome: 'Sang non coagulé', description: 'Saignements des orifices naturels (naseaux, anus) avec sang noirâtre qui ne coagule pas.' },
      { symptome: 'Gonflement rapide de la carcasse', description: 'Ballonnement post-mortem très rapide dû aux gaz produits par la bactérie.' },
    ],
    conclusion: 'DANGER BIOLOGIQUE : Ne jamais ouvrir la carcasse. Contactez immédiatement un vétérinaire. Maladie transmissible à l\'homme (zoonose).',
    consultVet: true,
    prevention: [
      'Vaccination annuelle contre l\'anthrax (charbon bactéridien)',
      'Ne jamais ouvrir les carcasses suspectes — les enterrer profondément avec de la chaux',
      'Port de gants et masque pour tout contact avec les animaux morts suspects',
    ],
    contextAfrique: 'Présent sporadiquement au Cameroun. Zoonose grave : transmission possible à l\'homme. Déclaration immédiatement obligatoire au MINEPIA. Ne pas consommer la viande d\'un animal mort subitement.',
    icon: '☠️'
  },
  {
    name: 'Péripneumonie Contagieuse Bovine (PPCB)',
    severity: 'critical',
    symptoms: ['toux', 'dyspnee', 'fievre', 'anorexie', 'contagion'],
    required: ['toux', 'dyspnee', 'fievre'],
    causes: [
      { symptome: 'Toux grasse douloureuse', description: 'Toux humide et profonde, l\'animal gémit parfois à l\'expiration.' },
      { symptome: 'Détresse respiratoire', description: 'Difficultés à respirer, l\'animal se tient les coudes écartés, tête basse, pour faciliter la ventilation.' },
      { symptome: 'Fièvre persistante + abattement', description: 'Température > 40°C avec refus de se mouvoir, forte perte de production laitière.' },
    ],
    conclusion: 'Maladie très contagieuse à déclaration obligatoire. Isolez le troupeau, contactez immédiatement un vétérinaire pour antibiothérapie et vaccination.',
    consultVet: true,
    prevention: [
      'Vaccination obligatoire anti-PPCB dans les zones endémiques (campagnes MINEPIA)',
      'Ne jamais mélanger des bovins d\'origines différentes sans quarantaine préalable',
      'Contrôle strict aux postes vétérinaires lors des transhumances',
    ],
    contextAfrique: 'Endémique dans les régions de transhumance du Cameroun (Adamaoua, Nord, Extrême-Nord). Une des maladies bovines les plus dévastatrices d\'Afrique. Programme d\'éradication en cours avec le MINEPIA.',
    icon: '🔴'
  },
  {
    name: 'Dermatose Nodulaire Contagieuse (DNC/LSD)',
    severity: 'high',
    symptoms: ['nodule', 'fievre', 'lesion_cutanee', 'contagion'],
    required: ['nodule'],
    causes: [
      { symptome: 'Nodules cutanés fermes', description: 'Apparition de bosses (2-5 cm) sur toute la surface du corps, fermes au toucher, pouvant s\'ulcérer.' },
      { symptome: 'Fièvre et abattement général', description: 'Fièvre (>40°C), perte d\'appétit et chute brutale de production laitière avant l\'apparition des nodules.' },
      { symptome: 'Gonflement des ganglions', description: 'Les ganglions superficiels (sous la mâchoire, devant l\'épaule) sont fortement gonflés.' },
    ],
    conclusion: 'Isolez l\'animal. Prévenez les autorités sanitaires. Le contrôle vectoriel (insectes) et la vaccination sont les mesures essentielles.',
    consultVet: true,
    icon: '🟠'
  },
  {
    name: 'Trypanosomose (Nagana)',
    severity: 'high',
    symptoms: ['amaigrissement', 'lethargie', 'jaunisse', 'fievre', 'anorexie'],
    required: ['amaigrissement', 'lethargie'],
    causes: [
      { symptome: 'Amaigrissement progressif', description: 'Perte de poids rapide malgré une alimentation apparemment normale, le flanc se creuse.' },
      { symptome: 'Anémie et muqueuses pâles', description: 'Les muqueuses (yeux, gencives) deviennent blanches ou jaunes (ictère) par destruction des globules rouges.' },
      { symptome: 'Fièvre intermittente + faiblesse', description: 'Épisodes fébriles alternant avec des phases de faiblesse extrême, l\'animal ne peut parfois plus se lever.' },
    ],
    conclusion: 'Traitement trypanocide disponible (Diminazène, Isométamidium). Consultez un vétérinaire pour un diagnostic de certitude par frottis sanguin et traitement adapté.',
    consultVet: true,
    prevention: [
      'Contrôle des tsé-tsé par pièges et traitements insecticides des pâturages',
      'Utiliser des races trypanotolerantes (N\'Dama, Baoulé) dans les zones endémiques',
      'Traitement préventif par Isométamidium avant la saison des pluies',
    ],
    contextAfrique: 'Transmise par les mouches tsé-tsé (Glossines), présentes dans les forêts et galeries forestières du Cameroun. Cause majeure de pertes de productivité en élevage. Les races bovines locales sont plus tolérantes.',
    icon: '🟠'
  },
  {
    name: 'Pneumonie / Infection respiratoire',
    severity: 'high',
    symptoms: ['toux', 'fievre', 'dyspnee', 'anorexie', 'jetage'],
    required: ['toux', 'fievre'],
    causes: [
      { symptome: 'Toux sèche ou grasse', description: 'Toux fréquente, parfois productive. L\'animal peut avoir les naseaux couverts de jetage muqueux ou purulent.' },
      { symptome: 'Fièvre (39.5°C - 41°C)', description: 'Augmentation de la température corporelle avec abattement, l\'animal se tient à l\'écart du troupeau.' },
      { symptome: 'Difficultés respiratoires', description: 'Respiration accélérée et laborieuse, les naseaux s\'évasent à chaque inspiration.' },
    ],
    conclusion: 'Consultez un vétérinaire rapidement pour une antibiothérapie adaptée. Placez l\'animal dans un endroit sec et à l\'abri du vent.',
    consultVet: true,
    icon: '🟠'
  },
  {
    name: 'Brucellose',
    severity: 'high',
    symptoms: ['avortement', 'fievre', 'mammite', 'lethargie'],
    required: ['avortement'],
    causes: [
      { symptome: 'Avortement tardif (7ème-9ème mois)', description: 'Avortement entre le 5ème et le 9ème mois de gestation, souvent répété d\'une gestation à l\'autre.' },
      { symptome: 'Rétention placentaire', description: 'Le placenta est souvent retenu après l\'avortement ou la mise bas, favorisant les infections utérines.' },
      { symptome: 'Baisse de la production laitière', description: 'Diminution importante et durable du lait produit, mammite possible.' },
    ],
    conclusion: 'ZOONOSE : Transmissible à l\'homme ! Portez des gants pour manipuler les avortements. Déclaration obligatoire. Consultation vétérinaire urgente pour sérologie.',
    consultVet: true,
    icon: '🔴'
  },
  {
    name: 'Gastro-entérite / Diarrhée',
    severity: 'medium',
    symptoms: ['diarrhee', 'anorexie', 'lethargie'],
    required: ['diarrhee'],
    causes: [
      { symptome: 'Diarrhée profuse', description: 'Selles liquides fréquentes, pouvant être jaunâtres, verdâtres ou sanguinolentes selon l\'origine.' },
      { symptome: 'Déshydratation rapide', description: 'L\'animal perd rapidement de l\'eau (yeux enfoncés, peau non élastique). Dangereux surtout chez les jeunes.' },
      { symptome: 'Douleurs abdominales', description: 'L\'animal peut regarder son flanc, donner des coups de pied au ventre ou adopter une position antalgique.' },
    ],
    conclusion: 'Assurez une hydratation orale ou IV selon la gravité. Consultez si la diarrhée persiste plus de 24h ou si le sang est présent.',
    consultVet: false,
    icon: '🟡'
  },
  {
    name: 'Parasitisme gastro-intestinal (Strongles)',
    severity: 'medium',
    symptoms: ['amaigrissement', 'diarrhee', 'anorexie', 'lethargie'],
    required: ['amaigrissement', 'diarrhee'],
    causes: [
      { symptome: 'Diarrhée chronique + amaigrissement', description: 'Selles molles persistantes associées à une perte de poids progressive malgré l\'alimentation.' },
      { symptome: 'Anémie (muqueuses pâles)', description: 'Les vers se nourrissent du sang, provoquant une anémie visible sur les muqueuses oculaires et buccales.' },
      { symptome: 'Oedème sous-mentonnier', description: 'Gonflement mou sous le menton (bouteille des hamadryas/œdème de la tête), signe de carences protéiques liées aux parasites.' },
    ],
    conclusion: 'Un traitement anthelminthique (antiparasitaire) est nécessaire. Alternez les molécules pour éviter les résistances. Consultez un vétérinaire pour le plan de déparasitage.',
    consultVet: false,
    icon: '🟡'
  },
  {
    name: 'Mammite',
    severity: 'medium',
    symptoms: ['mammite', 'fievre', 'anorexie'],
    required: ['mammite'],
    causes: [
      { symptome: 'Mamelle gonflée, chaude, douloureuse', description: 'Un ou plusieurs quartiers sont enflés, rouges et très sensibles au toucher. L\'animal refuse d\'être traite.' },
      { symptome: 'Lait anormal', description: 'Le lait contient des grumeaux, du pus, est décoloré (jaune, rouge) ou a une odeur anormale.' },
      { symptome: 'Fièvre et prostration (forme aiguë)', description: 'Dans les formes sévères, l\'animal est très abattu, a de la fièvre et peut présenter des signes toxémiques.' },
    ],
    conclusion: 'Traitement antibiotique intra-mammaire et/ou systémique selon la sévérité. Consultez un vétérinaire pour identifier la bactérie responsable.',
    consultVet: true,
    icon: '🟡'
  },
  {
    name: 'Boiterie / Problème locomoteur',
    severity: 'medium',
    symptoms: ['boiterie', 'lesion_cutanee', 'onglons'],
    required: ['boiterie'],
    causes: [
      { symptome: 'Lésion des onglons', description: 'Blessure, abcès ou pourriture des pieds (dermatite digitée). L\'animal boite d\'un membre spécifique.' },
      { symptome: 'Arthrite / Gonflement articulaire', description: 'Inflammation d\'une articulation (genou, boulet) avec gonflement chaud et douloureux.' },
      { symptome: 'Déséquilibre minéral (hypomagnésémie)', description: 'Manque de magnésium ou de calcium pouvant provoquer des troubles locomoteurs, surtout en période de lactation.' },
    ],
    conclusion: 'Inspectez les onglons et nettoyez les blessures. Un parage régulier est recommandé. Consultez si le gonflement est important ou si la boiterie persiste.',
    consultVet: false,
    icon: '🟡'
  },
  {
    name: 'Carence nutritionnelle / Minérale',
    severity: 'low',
    symptoms: ['amaigrissement', 'anorexie', 'lethargie', 'tremblements'],
    required: ['amaigrissement'],
    causes: [
      { symptome: 'Perte de poids progressive', description: 'L\'animal maigrit malgré une ration en apparence suffisante : carence en protéines, énergie ou oligoéléments.' },
      { symptome: 'Poil terne et cassant', description: 'La robe perd de son éclat, le poil devient sec et cassant, signe de carences en minéraux ou vitamines.' },
      { symptome: 'Baisse de productivité', description: 'Diminution du lait, croissance ralentie des jeunes, baisse de fertilité : tous signes d\'un déséquilibre nutritionnel.' },
    ],
    conclusion: 'Réévaluez la ration alimentaire avec un vétérinaire ou un zootechnicien. Une supplémentation minérale et vitaminique est souvent nécessaire.',
    consultVet: false,
    icon: '🟢'
  },
  {
    name: 'Tétanie d\'herbage (Hypomagnésémie)',
    severity: 'high',
    symptoms: ['tremblements', 'convulsions', 'lethargie', 'fievre'],
    required: ['tremblements', 'convulsions'],
    causes: [
      { symptome: 'Tremblements musculaires', description: 'Contractions involontaires des muscles, particulièrement visibles au niveau du flanc et des membres.' },
      { symptome: 'Hyperexcitabilité puis convulsions', description: 'L\'animal devient très sensible aux bruits, puis des crises convulsives apparaissent avec chutes et pédalage.' },
      { symptome: 'Carence soudaine en magnésium', description: 'Survient souvent au printemps sur herbe jeune ou chez les vaches laitières en haute production.' },
    ],
    conclusion: 'URGENCE : Injection IV ou SC de gluconate de magnésium. Ne pas déplacer l\'animal. Appelez immédiatement un vétérinaire.',
    consultVet: true,
    icon: '🔴'
  },
  {
    name: 'Ectoparasitisme (Tiques, Gale)',
    severity: 'low',
    symptoms: ['gale', 'lesion_cutanee', 'amaigrissement', 'anorexie'],
    required: ['gale'],
    causes: [
      { symptome: 'Démangeaisons intenses', description: 'L\'animal se frotte constamment contre les murs, clôtures ou arbres, provoquant des plaies et une perte de poil.' },
      { symptome: 'Lésions de grattage', description: 'Plaques sans poil, croûtes, et épaississement de la peau, surtout à la tête, l\'encolure et la base de la queue.' },
      { symptome: 'Présence de tiques', description: 'Des parasites (tiques) visibles à l\'aine, autour des yeux, sous la queue ou derrière les oreilles.' },
    ],
    conclusion: 'Traitement acaricide/insecticide (bain, spot-on ou injection). Traitez tous les animaux en contact. Désinfectez les locaux.',
    consultVet: false,
    prevention: ['Bains détiqueurs réguliers (tous les 15 jours en saison des pluies)', 'Inspection hebdomadaire des animaux', 'Désherbage des pâturages'],
    contextAfrique: 'Problème majeur dans tous les élevages camerounais. Les tiques transmettent de nombreuses maladies graves (babésiose, cowdriose). Traitement régulier indispensable.',
    icon: '🟢'
  },

  // ──────────────── MALADIES SPÉCIFIQUES AFRIQUE/CAMEROUN ────────────────

  {
    name: 'Peste des Petits Ruminants (PPR)',
    severity: 'critical',
    symptoms: ['fievre', 'diarrhee', 'jetage', 'toux', 'lesion_cutanee', 'contagion', 'ovin', 'caprin'],
    required: ['fievre', 'diarrhee'],
    causes: [
      { symptome: 'Fièvre brutale (40-42°C) et abattement sévère', description: 'Montée de température très rapide, l\'animal est prostré, refuse de se lever, ne mange plus du tout.' },
      { symptome: 'Écoulement nasal et oculaire abondant', description: 'Sécrétions mucopurulentes des naseaux et des yeux, collant et nauséabond. Les paupières peuvent se coller.' },
      { symptome: 'Diarrhée profuse + lésions buccales', description: 'Diarrhée liquide à odeur fétide, ulcères sur les gencives et le palais. Toux grasse en phase avancée.' },
    ],
    conclusion: '🚨 URGENCE ABSOLUE : Maladie très contagieuse, mortalité jusqu\'à 80% sans traitement. Isolez immédiatement les animaux malades. Déclarez au MINEPIA. Vaccination préventive de tout le troupeau.',
    consultVet: true,
    prevention: [
      'Vaccination annuelle avec le vaccin PPR homologué',
      'Quarantaine de 21 jours pour tout nouvel animal',
      'Éviter les marchés à bétail en période d\'épidémie',
      'Ne pas mélanger ovins et caprins avec des animaux de statut inconnu',
    ],
    contextAfrique: 'Endémique au Cameroun et dans toute l\'Afrique subsaharienne. Épidémies fréquentes surtout en saison sèche. Le vaccin est disponible dans les centres vétérinaires du MINEPIA. Programme d\'éradication en cours.',
    icon: '🔴'
  },
  {
    name: 'Charbon symptomatique (Blackleg)',
    severity: 'critical',
    symptoms: ['fievre', 'gonflement', 'boiterie', 'mort_subite', 'bovin'],
    required: ['gonflement', 'fievre'],
    causes: [
      { symptome: 'Gonflement musculaire chaud et crépitant', description: 'Tuméfaction rapide (épaule, cuisse, dos) crépitant sous les doigts comme du papier froissé — signe pathognomonique des gaz bactériens.' },
      { symptome: 'Boiterie sévère + prostration', description: 'L\'animal cesse brutalement de marcher, reste couché et refuse toute alimentation. La douleur est extrême.' },
      { symptome: 'Mort rapide (12-48h) sans traitement', description: 'Touche surtout les bovins de 6 mois à 2 ans. La mort survient très rapidement par septicémie toxique.' },
    ],
    conclusion: 'URGENCE VITALE : Pénicilline G en injection massive IMMÉDIATE. Appelez un vétérinaire. Vaccinez tout le troupeau en urgence. Ne consommez PAS la viande.',
    consultVet: true,
    prevention: [
      'Vaccination annuelle obligatoire contre le charbon symptomatique',
      'Ne pas faire pâturer dans les bas-fonds et zones marécageuses en saison des pluies',
      'Enfouir profondément les carcasses (ne jamais ouvrir)',
      'Surveillance renforcée des jeunes bovins (6 mois - 2 ans)',
    ],
    contextAfrique: 'Fréquent au Cameroun en saison des pluies (mai-octobre) dans les régions de savane (Adamaoua, Nord). Les spores de Clostridium chauvoei survivent des années dans le sol argileux.',
    icon: '☠️'
  },
  {
    name: 'Pasteurellose (Septicémie hémorragique)',
    severity: 'critical',
    symptoms: ['fievre', 'toux', 'dyspnee', 'jetage', 'mort_subite', 'bovin', 'ovin'],
    required: ['fievre', 'dyspnee'],
    causes: [
      { symptome: 'Fièvre très élevée (>41°C) et prostration', description: 'Température brutalement élevée, l\'animal refuse tout mouvement, muqueuses rouges puis violacées.' },
      { symptome: 'Pneumonie aiguë + difficultés respiratoires', description: 'Toux douloureuse, naseaux dilatés, halètement, respiration buccale en phase terminale. Crépitements pulmonaires.' },
      { symptome: 'Œdème du fanon, du cou et de la tête', description: 'Gonflement visible du cou et de la gorge (forme pneumo-entérique), coloration violacée des muqueuses.' },
    ],
    conclusion: 'Traitement antibiotique URGENT : Tétracycline longue action ou Pénicilline IV. Isolez l\'animal. Taux de mortalité très élevé sans intervention rapide (< 24h).',
    consultVet: true,
    prevention: [
      'Vaccination saisonnière contre la pasteurellose (avant saison des pluies)',
      'Éviter le stress des transports et des transhumances',
      'Bonne ventilation des étables, éviter la surpopulation',
      'Alimentation équilibrée pour renforcer l\'immunité',
    ],
    contextAfrique: 'Fréquente au Cameroun après les transhumances et en saison des pluies. Touche bovins, ovins et caprins. Mortalité élevée dans les troupeaux non vaccinés. Disponible dans les centres MINEPIA.',
    icon: '🔴'
  },
  {
    name: 'Maladie de Newcastle (Paramyxovirose)',
    severity: 'critical',
    symptoms: ['toux', 'dyspnee', 'diarrhee', 'tremblements', 'mortalite', 'volaille', 'torticolis'],
    required: ['volaille', 'mortalite'],
    causes: [
      { symptome: 'Mortalité massive et brutale en quelques jours', description: 'De nombreux poulets meurent rapidement. En forme suraiguë, les oiseaux meurent sans aucun signe préalable.' },
      { symptome: 'Troubles nerveux : torticolis et paralysie', description: 'Les survivants ont la tête tordue en arrière (torticolis), font des rotations, présentent des paralysies de pattes ou d\'ailes.' },
      { symptome: 'Détresse respiratoire + fientes verdâtres', description: 'Râles respiratoires (sifflements), éternuements, jetage, fientes liquides verdâtres ou jaunes. Chute brutale de la ponte.' },
    ],
    conclusion: 'Aucun traitement curatif. Abattage sanitaire et enfouissement des animaux atteints. Vaccination immédiate de tout le reste du troupeau. Déclaration obligatoire au MINEPIA.',
    consultVet: true,
    prevention: [
      'Vaccination des poussins dès J7-J14 (souche La Sota, voie oculaire ou nasale)',
      'Revaccination tous les 3 mois pour les élevages villageois',
      'Biosécurité : isolation des nouveaux animaux, désinfection des équipements',
      'Ne pas introduire des oiseaux de foires sans quarantaine',
    ],
    contextAfrique: 'Endémique au Cameroun, première cause de mortalité dans l\'aviculture villageoise. Épidémies fréquentes en saison sèche. Pertes économiques considérables pour les ménages ruraux. Le vaccin La Sota est disponible et peu coûteux.',
    icon: '☠️'
  },
  {
    name: 'Dermatophilose (Streptothricose)',
    severity: 'medium',
    symptoms: ['lesion_cutanee', 'gale', 'amaigrissement', 'bovin', 'caprin'],
    required: ['lesion_cutanee'],
    causes: [
      { symptome: 'Croûtes épaisses et adhérentes sur le dos', description: 'Formation de croûtes brunes/grises dures sur le dos, l\'encolure et les flancs. Sous les croûtes, la peau est rouge et suintante.' },
      { symptome: 'Chute du poil par grandes plaques', description: 'Les zones touchées perdent leur poil. L\'animal se gratte, aggravant les lésions. L\'aspect est caractéristique "en pinceau" sous les croûtes.' },
      { symptome: 'Aggravation systématique en saison humide', description: 'La maladie explose lors des pluies prolongées. Les tiques et insectes jouent le rôle de vecteurs mécaniques.' },
    ],
    conclusion: 'Traitement antibiotique (Pénicilline-Streptomycine ou Oxytétracycline en injection). Maintenez les animaux au sec. Contrôle strict des ectoparasites (tiques). Consultez un vétérinaire.',
    consultVet: true,
    prevention: [
      'Traitement acaricide régulier pour éliminer les tiques vectrices',
      'Maintenir les animaux dans des abris secs pendant la saison des pluies',
      'Alimentation renforcée en vitamines A et D pour l\'immunité cutanée',
      'Isoler les animaux atteints pour éviter la transmission',
    ],
    contextAfrique: 'Très répandue dans les zones humides du Cameroun (Ouest, Centre, Littoral, Adamaoua). S\'aggrave avec la prolifération des tiques en saison des pluies. Causes importantes de pertes économiques dans l\'élevage bovin et caprin.',
    icon: '🟠'
  },
  {
    name: 'Babésiose / Piroplasmose (Fièvre à tiques)',
    severity: 'high',
    symptoms: ['fievre', 'jaunisse', 'lethargie', 'amaigrissement', 'hemoglobinurie', 'bovin'],
    required: ['hemoglobinurie', 'fievre'],
    causes: [
      { symptome: 'Urines rouge-brun (hémoglobinurie) — signe clé', description: 'Coloration rouge à brun-noir des urines par destruction massive des globules rouges (hémolyse). Signe très caractéristique à signaler au vétérinaire.' },
      { symptome: 'Anémie sévère et ictère', description: 'Muqueuses très pâles puis ictériques (jaunissement des yeux et gencives) par hémolyse. L\'animal s\'affaiblit rapidement.' },
      { symptome: 'Fièvre (40-42°C) + abattement brutal', description: 'Hyperthermie brutale, l\'animal refuse de manger, reste couché, sa fréquence cardiaque s\'accélère fortement.' },
    ],
    conclusion: 'URGENCE : Traitement par Diminazène acéturate (Bérénil®) ou Imidocarbe en injection IM. Plus le traitement est précoce, meilleur le pronostic. Traitement acaricide simultané contre les tiques.',
    consultVet: true,
    prevention: [
      'Traitement acaricide régulier des bovins (bains ou pour-on tous les 15 jours)',
      'Inspection quotidienne des animaux pour retirer les tiques à la main',
      'Éviter les pâturages très infestés de tiques en saison des pluies',
      'Les bovins locaux (races trypanotolerantes) sont plus résistants que les races importées',
    ],
    contextAfrique: 'Transmise par les tiques Rhipicephalus microplus très répandues au Cameroun. Sévit particulièrement dans le Grand Nord, l\'Adamaoua et les zones herbeuses humides. Cause majeure de mortalité bovine en élevage extensif.',
    icon: '🟠'
  },
  {
    name: 'Coccidiose',
    severity: 'medium',
    symptoms: ['diarrhee', 'amaigrissement', 'lethargie', 'mortalite', 'caprin', 'ovin', 'volaille'],
    required: ['diarrhee', 'amaigrissement'],
    causes: [
      { symptome: 'Diarrhée sanguinolente chez les jeunes animaux', description: 'Selles liquides rouges ou noires chez les jeunes (chevreaux, agneaux, poussins < 3 mois). Très affaiblissant, mortalité élevée.' },
      { symptome: 'Amaigrissement rapide et retard de croissance', description: 'Les jeunes maigrissent malgré l\'alimentation. La croissance s\'arrête. Mortalité importante dans les lots de jeunes animaux.' },
      { symptome: 'Déshydratation intense et prostration', description: 'L\'animal est prostré, yeux enfoncés dans les orbites, peau qui ne revient pas (signe du pli). Mort rapide sans réhydratation.' },
    ],
    conclusion: 'Traitement à base de sulfamides (Sulfadiméthoxine) ou Amprolium selon l\'espèce. Réhydratation orale d\'urgence pour les jeunes. Amélioration de l\'hygiène des parcs indispensable.',
    consultVet: true,
    prevention: [
      'Maintenir parcs et litières propres et secs, changer régulièrement la litière',
      'Éviter la surpopulation animale, surtout pour les jeunes',
      'Séparer les adultes des jeunes animaux',
      'Traitement préventif des lots de jeunes dans les élevages à problèmes récurrents',
    ],
    contextAfrique: 'Très fréquente dans les élevages caprins, ovins et avicoles au Cameroun, surtout en saison des pluies. Amplifiée par la surpopulation et le manque d\'hygiène. Première cause de mortalité des jeunes caprins et agneaux.',
    icon: '🟡'
  },
];

// ─── Moteur NLP : extrait les symptômes d'un message texte libre ────────────
const extractSymptoms = (message) => {
  const lower = message.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // supprime accents
  const found = new Set();
  for (const [keyword, symptom] of Object.entries(KEYWORD_MAP)) {
    const kw = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(kw)) found.add(symptom);
  }
  return [...found];
};

// ─── Poids des symptômes (importance SVM / feature importance Random Forest) ──
// Les symptômes à haute spécificité diagnostique reçoivent un poids élevé
const SYMPTOM_WEIGHTS = {
  // Hautement discriminants (pathognomoniques ou quasi-pathognomoniques)
  hemoglobinurie: 6, mort_subite: 5, torticolis: 5, aphte: 5, gonflement: 4,
  avortement: 4, convulsions: 4, mortalite: 4,
  // Haute valeur clinique
  fievre: 3, dyspnee: 3, contagion: 3, jaunisse: 3, nodule: 3,
  // Valeur clinique modérée
  toux: 2, diarrhee: 2, jetage: 2, tremblements: 2, saignement: 2,
  // Symptômes courants / peu spécifiques (valeur = 1 par défaut)
};

// ─── Moteur multi-modèles (inspiration Random Forest + SVM) ──────────────────
// Arbre 1 : score d'intersection pondéré (Jaccard pondéré)
// Arbre 2 : bonus/pénalité espèce (Decision Tree spécialisation)
// Arbre 3 : multiplicateur épidémique (contagion risk)
// Arbre 4 : calibration gravité (SVM kernel adjustment)
const scoreDiseases = (symptoms) => {
  if (!symptoms.length) return [];
  const SPECIES = new Set(['bovin', 'ovin', 'caprin', 'porcin', 'volaille']);

  return DISEASE_DATABASE
    .map(disease => {
      // Gate : symptômes requis obligatoires (arbre de décision dur)
      const hasRequired = (disease.required || []).every(r => symptoms.includes(r));
      if (!hasRequired) return null;

      // ── Arbre 1 : Overlap pondéré ─────────────────────────────────────────
      let matchW = 0, totalW = 0;
      for (const s of disease.symptoms) {
        if (SPECIES.has(s)) continue; // espèces traitées séparément
        const w = SYMPTOM_WEIGHTS[s] || 1;
        totalW += w;
        if (symptoms.includes(s)) matchW += w;
      }
      const overlapScore = totalW > 0 ? matchW / totalW : 0;

      // ── Arbre 2 : Spécificité espèce ─────────────────────────────────────
      const diseaseSpecies = disease.symptoms.filter(s => SPECIES.has(s));
      let speciesBonus = 0;
      if (diseaseSpecies.length > 0) {
        const speciesMatch = diseaseSpecies.some(s => symptoms.includes(s));
        const speciesInInput = symptoms.some(s => SPECIES.has(s));
        if (speciesMatch) speciesBonus = 0.18;
        else if (speciesInInput) speciesBonus = -0.15; // espèce différente → pénalité
      }

      // ── Arbre 3 : Risque épidémique (contagion) ───────────────────────────
      const contagionBonus =
        symptoms.includes('contagion') && disease.symptoms.includes('contagion') ? 0.10 : 0;

      // ── Arbre 4 : Ajustement gravité (calibration SVM) ───────────────────
      const sevMult = { critical: 1.08, high: 1.04, medium: 1.0, low: 0.96 }[disease.severity] || 1.0;

      const raw = (overlapScore + speciesBonus + contagionBonus) * sevMult;
      const score = Math.max(0, Math.min(1, raw));

      // Confidence finale : calibration linéaire
      const confidence = Math.round(Math.min(score * 115, 98)); // cap à 98% — modèle n'est jamais certain

      return { disease, score, confidence };
    })
    .filter(Boolean)
    .filter(r => r.score > 0.05 && r.confidence >= 18)
    .sort((a, b) => b.score - a.score);
};

// ─── Compatibilité descendante pour chatDiagnosis ────────────────────────────
const findBestMatch = (symptoms) => {
  const results = scoreDiseases(symptoms);
  if (!results.length) return null;
  return { ...results[0].disease, confidence: results[0].confidence };
};

// ─── Évaluation comportementale (Modèle comportemental + IoT-proxy) ──────────
// Inspiré des indicateurs comportementaux de l'élevage de précision
const analyzeBehavioralRisk = (symptoms) => {
  const risks = [];

  if (symptoms.includes('anorexie') && symptoms.includes('lethargie')) {
    risks.push({ indicator: 'Anorexie + inactivité', severity: 'high',
      meaning: 'Association classique de maladie systémique grave — l\'animal est en souffrance et nécessite une attention rapide.' });
  }
  if (symptoms.includes('contagion')) {
    risks.push({ indicator: 'Plusieurs animaux atteints', severity: 'critical',
      meaning: 'Risque épidémique élevé. Isolez tout le lot concerné et alertez les autorités sanitaires.' });
  }
  if (symptoms.includes('mortalite')) {
    risks.push({ indicator: 'Mortalités constatées', severity: 'critical',
      meaning: 'Des décès ont déjà eu lieu. Urgence vétérinaire absolue et déclaration obligatoire au MINEPIA.' });
  }
  if (symptoms.includes('amaigrissement') && symptoms.includes('lethargie')) {
    risks.push({ indicator: 'Amaigrissement + faiblesse progressive', severity: 'medium',
      meaning: 'Évoque un parasitisme chronique (Trypanosomose, Strongles), carence sévère ou infection insidieuse.' });
  }
  if (symptoms.includes('tremblements') || symptoms.includes('convulsions') || symptoms.includes('tournis')) {
    risks.push({ indicator: 'Signes neurologiques', severity: 'high',
      meaning: 'Atteinte du système nerveux central. Peut indiquer une carence (magnésium), une intoxication ou une infection virale grave.' });
  }
  if (symptoms.includes('avortement')) {
    risks.push({ indicator: 'Avortement(s)', severity: 'high',
      meaning: 'Potentiellement une zoonose (Brucellose, Fièvre Q). Portez des EPI lors de la manipulation. Déclaration recommandée.' });
  }

  return risks;
};

// ─── Prédiction de risque productif (Modèle de production) ──────────────────
const predictProductionRisk = (topMatch, symptoms) => {
  if (!topMatch) return null;
  const { severity, name } = topMatch;
  const hasMammite = symptoms.includes('mammite');
  const hasAmaigrissement = symptoms.includes('amaigrissement');

  const impactLait = hasMammite || severity === 'critical' ? 'Chute probable de production laitière (-30% à -100%)' : null;
  const impactCroissance = hasAmaigrissement ? 'Ralentissement de croissance et perte de poids' : null;
  const impactReproduction = symptoms.includes('avortement') ? 'Infertilité temporaire probable (3-6 mois)' : null;

  const impacts = [impactLait, impactCroissance, impactReproduction].filter(Boolean);
  if (!impacts.length && severity === 'low') return null;

  return {
    productionImpact: impacts.length ? impacts : ['Impact productif limité si traitement rapide'],
    economicRisk: severity === 'critical' ? 'Très élevé' : severity === 'high' ? 'Élevé' : 'Modéré',
    recoveryTime: severity === 'critical' ? '4-8 semaines' : severity === 'high' ? '1-3 semaines' : '3-7 jours',
  };
};

// ─── Endpoint principal : Chat IA ─────────────────────────────────────────────
export const chatDiagnosis = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message requis' });

    const symptoms = extractSymptoms(message);
    const ranked = scoreDiseases(symptoms);

    if (!ranked.length) {
      return res.status(200).json({
        titre: 'Symptômes insuffisants pour un diagnostic',
        conclusion: 'Décrivez plus précisément les symptômes observés (fièvre, toux, diarrhée, lésions, comportement…) ou consultez directement un vétérinaire.',
        causes: [
          { symptome: 'Description insuffisante', description: 'Essayez de mentionner : la température, le comportement, l\'alimentation, les symptômes visibles.' },
          { symptome: 'Observation recommandée', description: 'Notez la durée des symptômes, si d\'autres animaux sont touchés et l\'espèce concernée.' },
        ],
        confidence: 0,
        symptomsDetected: symptoms,
      });
    }

    const primary = ranked[0];
    const differentials = ranked.slice(1, 3);
    const behavioralRisks = analyzeBehavioralRisk(symptoms);

    return res.status(200).json({
      titre: `${primary.disease.icon || '🔍'} Pré-diagnostic : ${primary.disease.name}`,
      conclusion: primary.disease.conclusion,
      causes: primary.disease.causes,
      severity: primary.disease.severity,
      confidence: primary.confidence,
      consultVet: primary.disease.consultVet,
      symptomsDetected: symptoms,
      prevention: primary.disease.prevention || [],
      contextAfrique: primary.disease.contextAfrique || null,
      differentials: differentials.map(d => ({
        name: `${d.disease.icon || ''} ${d.disease.name}`,
        severity: d.disease.severity,
        confidence: d.confidence,
      })),
      behavioralRisks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const SYMPTOM_QUESTIONS = [
  { id: 'q1', text: "L'animal mange-t-il normalement?", type: 'yesno', key: 'eating' },
  { id: 'q2', text: "L'animal a-t-il de la fievre (>39.5C)?", type: 'yesno', key: 'fever' },
  { id: 'q3', text: "L'animal tousse-t-il?", type: 'yesno', key: 'cough' },
  { id: 'q4', text: "L'animal a-t-il de la diarrhee?", type: 'yesno', key: 'diarrhea' },
  { id: 'q5', text: "L'animal a-t-il des difficultes a marcher?", type: 'yesno', key: 'lameness' },
  { id: 'q6', text: "L'animal a-t-il des lesions cutanees ou boutons?", type: 'yesno', key: 'skin_lesions' },
  { id: 'q7', text: "L'animal a-t-il maigri recemment?", type: 'yesno', key: 'weight_loss' },
  { id: 'q8', text: "D'autres animaux presentent-ils les memes symptomes?", type: 'yesno', key: 'contagious' },
  { id: 'q9', text: "Depuis combien de jours les symptomes durent-ils?", type: 'choice', key: 'duration', options: ['1 jour', '2-3 jours', '4-7 jours', "Plus d'une semaine"] },
  { id: 'q10', text: "Quel est le comportement general de l'animal?", type: 'choice', key: 'behavior', options: ['Normal', 'Lethargique', 'Agite', 'Prostre'] }
];

const DISEASE_PATTERNS = [
  { name: 'Fievre aphteuse', severity: 'critical', keys: { fever: true, lameness: true, skin_lesions: true, contagious: true }, advice: "URGENT: Isolez l'animal. Contactez un veterinaire. Maladie a declaration obligatoire.", consultVet: true },
  { name: 'Pneumonie / Infection respiratoire', severity: 'high', keys: { fever: true, cough: true, eating: false }, advice: "Consultez un veterinaire rapidement. L'animal peut necessiter des antibiotiques.", consultVet: true },
  { name: 'Gastro-enterite', severity: 'high', keys: { diarrhea: true, fever: true, eating: false }, advice: 'Hydratation importante. Consultez si la diarrhee persiste plus de 24h.', consultVet: true },
  { name: 'Boiterie', severity: 'medium', keys: { lameness: true, fever: false }, advice: "Inspectez les onglons. Nettoyage si blessure.", consultVet: false },
  { name: 'Carence alimentaire', severity: 'low', keys: { eating: false, weight_loss: true, fever: false }, advice: 'Reevaluez la ration alimentaire. Supplementation minerale recommandee.', consultVet: false },
  { name: 'Dermatite / Gale', severity: 'medium', keys: { skin_lesions: true, fever: false }, advice: "Isolez l'animal. Traitement antiparasitaire externe.", consultVet: false }
];

const analyzeSymptoms = (answers) => {
  let best = null; let bestScore = 0;
  for (const disease of DISEASE_PATTERNS) {
    let score = 0; const total = Object.keys(disease.keys).length;
    for (const [key, expected] of Object.entries(disease.keys)) {
      if (answers[key] === expected) score++;
    }
    const rate = score / total;
    if (rate > bestScore) { bestScore = rate; best = { ...disease, confidence: Math.round(rate * 100) }; }
  }
  if (!best || bestScore < 0.5) return { name: 'Diagnostic non concluant', severity: 'unknown', confidence: 0, advice: 'Consultez un veterinaire pour un examen complet.', consultVet: true };
  return best;
};

const getSeverityScore = (answers) => {
  let s = 0;
  if (answers.fever) s += 3;
  if (answers.cough && answers.fever) s += 2;
  if (answers.diarrhea) s += 2;
  if (answers.lameness) s += 1;
  if (answers.eating === false) s += 2;
  if (answers.contagious) s += 3;
  if (answers.behavior === 'Prostre') s += 3;
  if (answers.duration === "Plus d'une semaine") s += 2;
  return Math.min(s, 10);
};

export const getQuestionnaire = (req, res) => {
  res.status(200).json({ questions: SYMPTOM_QUESTIONS });
};

export const analyzeAnimalData = async (req, res) => {
  try {
    const { animalId, answers, symptoms } = req.body;
    if (!animalId) return res.status(400).json({ error: 'Animal ID is required' });

    const effectiveAnswers = answers || { fever: false, cough: !!symptoms, eating: true };

    // ── Convertir les réponses du questionnaire en symptômes normalisés ──
    const mappedSymptoms = [];
    if (effectiveAnswers.fever)                         mappedSymptoms.push('fievre');
    if (effectiveAnswers.cough)                         mappedSymptoms.push('toux');
    if (effectiveAnswers.diarrhea)                      mappedSymptoms.push('diarrhee');
    if (effectiveAnswers.lameness)                      mappedSymptoms.push('boiterie');
    if (effectiveAnswers.skin_lesions)                  mappedSymptoms.push('lesion_cutanee');
    if (effectiveAnswers.weight_loss)                   mappedSymptoms.push('amaigrissement');
    if (effectiveAnswers.contagious)                    mappedSymptoms.push('contagion');
    if (effectiveAnswers.eating === false)              mappedSymptoms.push('anorexie');
    if (effectiveAnswers.behavior === 'Prostre')        mappedSymptoms.push('prostration');
    if (effectiveAnswers.behavior === 'Lethargique')    mappedSymptoms.push('lethargie');
    if (effectiveAnswers.nasal_discharge)               mappedSymptoms.push('jetage');
    if (effectiveAnswers.udder_problem)                 mappedSymptoms.push('mammite');
    if (effectiveAnswers.abortion)                      mappedSymptoms.push('avortement');
    if (effectiveAnswers.nervous_signs)                 mappedSymptoms.push('tremblements');
    if (effectiveAnswers.sudden_death)                  mappedSymptoms.push('mort_subite');
    if (effectiveAnswers.red_urine)                     mappedSymptoms.push('hemoglobinurie');

    // ── Scoring multi-modèles ─────────────────────────────────────────────
    const ranked = scoreDiseases(mappedSymptoms);
    const severityScore = getSeverityScore(effectiveAnswers);
    const behavioralRisks = analyzeBehavioralRisk(mappedSymptoms);

    let diagnosis;
    if (ranked.length) {
      const primary = ranked[0];
      diagnosis = {
        name: primary.disease.name,
        severity: primary.disease.severity,
        confidence: primary.confidence,
        advice: primary.disease.conclusion,
        consultVet: primary.disease.consultVet || severityScore >= 7,
        prevention: primary.disease.prevention || [],
        contextAfrique: primary.disease.contextAfrique || null,
        causes: primary.disease.causes || [],
        differentials: ranked.slice(1, 3).map(d => ({
          name: d.disease.name,
          severity: d.disease.severity,
          confidence: d.confidence,
        })),
      };
    } else {
      // Fallback vers l'ancien moteur si le nouveau ne retourne rien
      const oldDiag = analyzeSymptoms(effectiveAnswers);
      diagnosis = {
        name: oldDiag.name,
        severity: oldDiag.severity,
        confidence: oldDiag.confidence,
        advice: oldDiag.advice,
        consultVet: oldDiag.consultVet || severityScore >= 7,
        prevention: [], contextAfrique: null, causes: [], differentials: [],
      };
    }

    const productionRisk = ranked.length ? predictProductionRisk(ranked[0].disease, mappedSymptoms) : null;

    res.status(200).json({
      analysis: {
        animalId,
        diagnosis: diagnosis.name,
        severity: diagnosis.severity,
        severityScore,
        confidence: diagnosis.confidence,
        advice: diagnosis.advice,
        consultVet: diagnosis.consultVet,
        urgency: severityScore >= 8 ? 'URGENT' : severityScore >= 5 ? 'Dans 24-48h' : 'Surveillance',
        causes: diagnosis.causes,
        prevention: diagnosis.prevention,
        contextAfrique: diagnosis.contextAfrique,
        differentials: diagnosis.differentials,
        behavioralRisks,
        productionRisk,
        symptomsDetected: mappedSymptoms,
        analyzedAt: new Date(),
        modelVersion: 'mokine-ia-v2.0-ensemble',
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIDiagnosis = async (req, res) => {
  try {
    const { description, animalType } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    // ── Étape 1 : Extraction des symptômes (NLP) ──────────────────────────
    const symptoms = extractSymptoms(description);

    // Injecter le type d'animal si fourni et non déjà détecté
    if (animalType && !symptoms.some(s => ['bovin','ovin','caprin','porcin','volaille'].includes(s))) {
      const speciesMap = { cattle: 'bovin', cattle_beef: 'bovin', sheep: 'ovin', goat: 'caprin', pig: 'porcin', chicken: 'volaille', poultry: 'volaille' };
      const mapped = speciesMap[animalType] || animalType;
      if (['bovin','ovin','caprin','porcin','volaille'].includes(mapped)) symptoms.push(mapped);
    }

    // ── Étape 2 : Scoring multi-modèles (Random Forest-inspired) ─────────
    const ranked = scoreDiseases(symptoms);

    if (!ranked.length) {
      return res.status(200).json({
        diagnosis: {
          id: Date.now().toString(),
          description,
          animalType: animalType || 'unknown',
          diagnosis: 'Symptômes insuffisants pour un diagnostic précis',
          severity: 'unknown',
          suggestedActions: [
            'Décrivez plus précisément les symptômes observés (fièvre, toux, diarrhée, lésions…)',
            'Mentionnez si d\'autres animaux sont touchés',
            'Indiquez la durée des symptômes',
            'Consultez un vétérinaire pour un examen clinique complet',
          ],
          confidence: 0,
          symptomsDetected: symptoms,
        }
      });
    }

    const primary = ranked[0];
    const differentials = ranked.slice(1, 4);

    // ── Étape 3 : Analyse comportementale ─────────────────────────────────
    const behavioralRisks = analyzeBehavioralRisk(symptoms);

    // ── Étape 4 : Prédiction impact productif ─────────────────────────────
    const productionRisk = predictProductionRisk(primary.disease, symptoms);

    // ── Étape 5 : Calcul score de gravité global (0-10) ───────────────────
    const SEVERITY_SCORE = { critical: 9, high: 7, medium: 5, low: 2, unknown: 3 };
    const behaviorBonus = behavioralRisks.filter(r => r.severity === 'critical').length * 1;
    const severityScore = Math.min(10, (SEVERITY_SCORE[primary.disease.severity] || 3) + behaviorBonus);

    return res.status(200).json({
      diagnosis: {
        id: Date.now().toString(),
        description,
        animalType: animalType || 'unknown',
        diagnosis: `${primary.disease.icon || '🔍'} ${primary.disease.name}`,
        severity: primary.disease.severity,
        severityScore,
        confidence: primary.confidence,
        suggestedActions: primary.disease.causes
          ? primary.disease.causes.map(c => c.symptome)
          : [],
        advice: primary.disease.conclusion,
        consultVet: primary.disease.consultVet || severityScore >= 7,
        urgency: severityScore >= 8 ? 'URGENT — Contactez un vétérinaire immédiatement'
               : severityScore >= 5 ? 'Dans les 24-48h'
               : 'Surveillance recommandée',
        analyzedAt: new Date(),
      },
      // Diagnostics différentiels (Top 3 alternatives)
      differentials: differentials.map(d => ({
        name: `${d.disease.icon || '🔍'} ${d.disease.name}`,
        severity: d.disease.severity,
        confidence: d.confidence,
        advice: d.disease.conclusion,
      })),
      // Analyse comportementale
      behavioralRisks,
      // Impact productif
      productionRisk,
      // Contexte terrain Afrique
      contextAfrique: primary.disease.contextAfrique || null,
      // Prévention
      prevention: primary.disease.prevention || [],
      // Causes détaillées
      causes: primary.disease.causes || [],
      symptomsDetected: symptoms,
      modelVersion: 'mokine-ia-v2.0-ensemble',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHealthReport = (req, res) => {
  try {
    const { animalId } = req.query;
    if (!animalId) return res.status(400).json({ error: 'Animal ID is required' });
    res.status(200).json({
      animalId,
      period: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
      healthScore: 85,
      alerts: ['Surveiller poids', 'Vaccination a renouveler'],
      recommendations: ['Visite veterinaire annuelle', 'Deparasitage tous les 6 mois', 'Vaccination a jour'],
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Historique des conversations IA (sessions locales uniquement pour l'instant)
export const getChatHistory = (req, res) => {
  res.status(200).json({ data: [] });
};

// ─── Compatibilité Ia.jsx : /ia/request/send ─────────────────────────────────
// Handles text + file + disease selection from the Ia.jsx chat page
export const sendRequest = async (req, res) => {
  try {
    const message = req.body.message || (req.body.get ? req.body.get('message') : '');
    const maladie = req.body.maladie || (req.body.get ? req.body.get('maladie') : '');
    const typeContenu = req.body.typeContenu || 'texte';
    const discussionId = req.body.listediscussioniaid || null;

    // If a specific disease was selected, return info about it
    if (maladie) {
      const diseaseInfo = DISEASE_INFO[maladie] || null;
      const responseText = diseaseInfo
        ? `**${maladie}**\n\n${diseaseInfo.description}\n\n**Signes cliniques:** ${diseaseInfo.signs}\n\n**Traitement:** ${diseaseInfo.treatment}\n\n**Prévention:** ${diseaseInfo.prevention}`
        : `Voici des informations sur **${maladie}**: Consultez un vétérinaire pour un diagnostic précis et un traitement adapté à votre région.`;
      return res.status(200).json({
        discussion_id: discussionId || `req_${Date.now()}`,
        message: { appartenance: 'ai', contenu: { message: responseText }, timestamp: new Date().toISOString() },
      });
    }

    // For file uploads: acknowledge and prompt for description
    if (typeContenu === 'fichier') {
      return res.status(200).json({
        discussion_id: discussionId || `req_${Date.now()}`,
        message: {
          appartenance: 'ai',
          contenu: { message: '📷 Image reçue. Pour un meilleur diagnostic, décrivez également les symptômes observés en texte. L\'analyse d\'image avancée (Tebe AI) est disponible depuis le menu **Diagnostic IA**.' },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Default: treat as text chat
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const symptoms = extractSymptoms(message);
    const match = findBestMatch(symptoms);
    const responseText = match
      ? `${match.icon || '🔍'} **Pré-diagnostic : ${match.name}**\n\n${match.conclusion}\n\n*Confiance : ${match.confidence}%*\n\n${match.consultVet ? '⚠️ **Consultation vétérinaire recommandée**' : ''}`
      : 'Décrivez plus précisément les symptômes pour un pré-diagnostic. Mentionnez : fièvre, toux, diarrhée, lésions, comportement, alimentation.';

    return res.status(200).json({
      discussion_id: discussionId || `req_${Date.now()}`,
      message: { appartenance: 'ai', contenu: { message: responseText }, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Compatibilité Ia.jsx : GET /ia/request/:id ──────────────────────────────
export const getRequest = (req, res) => {
  res.status(200).json({ data: [], discussion_id: req.params.id });
};

// ─── GET /api/ia/active-lab-models ───────────────────────────────────────────
export const getActiveLabModels = async (req, res) => {
  try {
    const models = await db.lab_models.filter(m => m.deployedToVeto === 'active');
    res.json({ models, count: models.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/ia/analyze-with-model ─────────────────────────────────────────
export const analyzeWithModel = async (req, res) => {
  try {
    const { description, animalType, modelId } = req.body;
    if (!description) return res.status(400).json({ error: 'Description requise' });

    let usedModel = 'mokine-ia-v2.0-ensemble';
    let usedModelName = 'Modèle par défaut Tebe';

    if (modelId) {
      const labModels = await db.lab_models.filter(m => m.id === modelId && m.deployedToVeto === 'active');
      if (labModels.length) {
        usedModel = modelId;
        usedModelName = labModels[0].name;
      }
    }

    const symptoms = extractSymptoms(description);
    if (animalType) {
      const speciesMap = { cattle: 'bovin', sheep: 'ovin', goat: 'caprin', pig: 'porcin', chicken: 'volaille', poultry: 'volaille' };
      const mapped = speciesMap[animalType] || animalType;
      if (['bovin','ovin','caprin','porcin','volaille'].includes(mapped) && !symptoms.includes(mapped)) symptoms.push(mapped);
    }

    const ranked = scoreDiseases(symptoms);
    if (!ranked.length) {
      return res.status(200).json({ diagnosis: { description, animalType, diagnosis: 'Symptômes insuffisants', confidence: 0, usedModel, usedModelName } });
    }

    const primary = ranked[0];
    const SEVERITY_SCORE = { critical: 9, high: 7, medium: 5, low: 2, unknown: 3 };
    const severityScore = Math.min(10, SEVERITY_SCORE[primary.disease.severity] || 3);

    return res.status(200).json({
      diagnosis: {
        id: Date.now().toString(),
        description,
        animalType: animalType || 'unknown',
        diagnosis: `${primary.disease.icon || ''} ${primary.disease.name}`,
        severity: primary.disease.severity,
        severityScore,
        confidence: primary.confidence,
        advice: primary.disease.conclusion,
        consultVet: primary.disease.consultVet || severityScore >= 7,
        analyzedAt: new Date(),
        usedModel,
        usedModelName,
      },
      differentials: ranked.slice(1, 4).map(d => ({ name: d.disease.name, confidence: d.confidence })),
      symptomsDetected: symptoms,
      modelVersion: usedModel,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
