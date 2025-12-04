import { QuestFrequencies, TargetTypes } from '../../../../lib/appwrite';

/**
 * Exemples de données pour démarrer le système de gamification
 * Arcs, Quêtes et Paliers pré-définis
 */

export const EXAMPLE_ARCS = [
  {
    name: 'Mental',
    color: '#6366F6',
    icon: 'brain',
    description: 'Développement personnel, apprentissage, bien-être mental',
  },
  {
    name: 'Physique/Sport',
    color: '#22C55E',
    icon: 'fitness',
    description: 'Activité physique, performance, santé corporelle',
  },
  {
    name: 'Finance',
    color: '#F59E0B',
    icon: 'wallet',
    description: 'Épargne, investissement, indépendance financière',
  },
  {
    name: 'Business/Travail',
    color: '#3B82F6',
    icon: 'briefcase',
    description: 'Carrière, entrepreneuriat, productivité',
  },
  {
    name: 'Social',
    color: '#EC4899',
    icon: 'people',
    description: 'Réseau social, rencontres, événements',
  },
  {
    name: 'Couple',
    color: '#F472B6',
    icon: 'heart',
    description: 'Relation de couple, communication, projets communs',
  },
  {
    name: 'Famille',
    color: '#A855F7',
    icon: 'home',
    description: 'Temps en famille, activités partagées',
  },
  {
    name: 'Santé',
    color: '#10B981',
    icon: 'leaf',
    description: 'Alimentation, sommeil, bien-être général',
  },
];

export const EXAMPLE_QUESTS = [
  // Arc: Mental
  { arcName: 'Mental', name: 'Méditer 10 min', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 15 },
  { arcName: 'Mental', name: 'Lire 20 pages', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  { arcName: 'Mental', name: 'Tenir un journal', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 10 },
  { arcName: 'Mental', name: 'Apprendre une nouvelle compétence', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 4, xpPerCompletion: 50 },
  
  // Arc: Physique/Sport
  { arcName: 'Physique/Sport', name: 'Faire 30 min de sport', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 3, xpPerCompletion: 25 },
  { arcName: 'Physique/Sport', name: 'Courir 5 km', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 3, intensity: 3, xpPerCompletion: 30 },
  { arcName: 'Physique/Sport', name: 'Faire 100 pompes', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  { arcName: 'Physique/Sport', name: "S'étirer 15 min", frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 10 },
  
  // Arc: Finance
  { arcName: 'Finance', name: 'Épargner 50€', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 30 },
  { arcName: 'Finance', name: 'Suivre son budget', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 15 },
  { arcName: 'Finance', name: 'Investir 100€', frequency: QuestFrequencies.MONTHLY, repetitionPerPeriod: 1, intensity: 4, xpPerCompletion: 100 },
  { arcName: 'Finance', name: 'Réduire une dépense inutile', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 25 },
  
  // Arc: Business/Travail
  { arcName: 'Business/Travail', name: 'Faire 3 ventes', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 4, xpPerCompletion: 40 },
  { arcName: 'Business/Travail', name: 'Poster 1 contenu', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  { arcName: 'Business/Travail', name: 'Contacter 5 prospects', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 3, xpPerCompletion: 30 },
  { arcName: 'Business/Travail', name: "Participer à un événement networking", frequency: QuestFrequencies.MONTHLY, repetitionPerPeriod: 1, intensity: 3, xpPerCompletion: 80 },
  
  // Arc: Social
  { arcName: 'Social', name: 'Appeler un ami', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 2, intensity: 1, xpPerCompletion: 15 },
  { arcName: 'Social', name: "Organiser un événement", frequency: QuestFrequencies.MONTHLY, repetitionPerPeriod: 1, intensity: 3, xpPerCompletion: 60 },
  { arcName: 'Social', name: 'Rencontrer de nouvelles personnes', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 25 },
  { arcName: 'Social', name: "Participer à une activité de groupe", frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  
  // Arc: Couple
  { arcName: 'Couple', name: 'Date romantique', frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 30 },
  { arcName: 'Couple', name: 'Communication profonde', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 15 },
  { arcName: 'Couple', name: 'Projet commun', frequency: QuestFrequencies.MONTHLY, repetitionPerPeriod: 1, intensity: 4, xpPerCompletion: 80 },
  { arcName: 'Couple', name: 'Surprise pour le/la partenaire', frequency: QuestFrequencies.MONTHLY, repetitionPerPeriod: 1, intensity: 3, xpPerCompletion: 50 },
  
  // Arc: Famille
  { arcName: 'Famille', name: 'Temps qualité avec les enfants', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  { arcName: 'Famille', name: "Activité familiale", frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 35 },
  { arcName: 'Famille', name: "Aider un membre de la famille", frequency: QuestFrequencies.WEEKLY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 25 },
  { arcName: 'Famille', name: 'Repas en famille', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 15 },
  
  // Arc: Santé
  { arcName: 'Santé', name: 'Manger 5 fruits/légumes', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 15 },
  { arcName: 'Santé', name: 'Dormir 7-8h', frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
  { arcName: 'Santé', name: "Boire 2L d'eau", frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 1, xpPerCompletion: 10 },
  { arcName: 'Santé', name: "Éviter les aliments transformés", frequency: QuestFrequencies.DAILY, repetitionPerPeriod: 1, intensity: 2, xpPerCompletion: 20 },
];

export const EXAMPLE_TIERS = [
  // Arc: Mental
  { arcName: 'Mental', name: '7 jours de méditation', targetValue: 7, targetType: TargetTypes.COUNT, xpReward: 150, titleReward: 'Méditant' },
  { arcName: 'Mental', name: '30 jours de lecture', targetValue: 30, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Lecteur Assidu' },
  { arcName: 'Mental', name: '100 jours de journaling', targetValue: 100, targetType: TargetTypes.COUNT, xpReward: 1000, titleReward: 'Sage' },
  
  // Arc: Physique/Sport
  { arcName: 'Physique/Sport', name: '7 jours consécutifs de sport', targetValue: 7, targetType: TargetTypes.COUNT, xpReward: 200, titleReward: 'Actif' },
  { arcName: 'Physique/Sport', name: 'Courir un 10K', targetValue: 1, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Coureur' },
  { arcName: 'Physique/Sport', name: '1000 pompes totales', targetValue: 1000, targetType: TargetTypes.COUNT, xpReward: 800, titleReward: 'Fort' },
  
  // Arc: Finance
  { arcName: 'Finance', name: 'Épargner 1000€', targetValue: 1000, targetType: TargetTypes.AMOUNT, xpReward: 300, titleReward: 'Économe' },
  { arcName: 'Finance', name: '3 mois de budget suivi', targetValue: 3, targetType: TargetTypes.COUNT, xpReward: 400, titleReward: 'Gestionnaire' },
  { arcName: 'Finance', name: 'Premier investissement', targetValue: 1, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Investisseur' },
  
  // Arc: Business/Travail
  { arcName: 'Business/Travail', name: '10 ventes en une semaine', targetValue: 10, targetType: TargetTypes.COUNT, xpReward: 400, titleReward: 'Vendeur' },
  { arcName: 'Business/Travail', name: '1000 abonnés', targetValue: 1000, targetType: TargetTypes.COUNT, xpReward: 800, titleReward: 'Influenceur' },
  { arcName: 'Business/Travail', name: 'Premier client récurrent', targetValue: 1, targetType: TargetTypes.COUNT, xpReward: 600, titleReward: 'Entrepreneur' },
  
  // Arc: Social
  { arcName: 'Social', name: '10 nouvelles rencontres', targetValue: 10, targetType: TargetTypes.COUNT, xpReward: 300, titleReward: 'Social' },
  { arcName: 'Social', name: 'Organiser 5 événements', targetValue: 5, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Organisateur' },
  { arcName: 'Social', name: 'Réseau de 50 contacts', targetValue: 50, targetType: TargetTypes.COUNT, xpReward: 700, titleReward: 'Réseauteur' },
  
  // Arc: Couple
  { arcName: 'Couple', name: '10 dates réussies', targetValue: 10, targetType: TargetTypes.COUNT, xpReward: 400, titleReward: 'Romantique' },
  { arcName: 'Couple', name: '30 jours de communication', targetValue: 30, targetType: TargetTypes.COUNT, xpReward: 600, titleReward: 'Communicateur' },
  { arcName: 'Couple', name: 'Projet commun terminé', targetValue: 1, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Partenaire' },
  
  // Arc: Famille
  { arcName: 'Famille', name: '30 jours de temps qualité', targetValue: 30, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Parent' },
  { arcName: 'Famille', name: '10 activités familiales', targetValue: 10, targetType: TargetTypes.COUNT, xpReward: 400, titleReward: 'Famille' },
  { arcName: 'Famille', name: '100 repas en famille', targetValue: 100, targetType: TargetTypes.COUNT, xpReward: 800, titleReward: 'Unificateur' },
  
  // Arc: Santé
  { arcName: 'Santé', name: '30 jours d\'alimentation saine', targetValue: 30, targetType: TargetTypes.COUNT, xpReward: 500, titleReward: 'Santé' },
  { arcName: 'Santé', name: '7 jours de sommeil optimal', targetValue: 7, targetType: TargetTypes.COUNT, xpReward: 200, titleReward: 'Reposé' },
  { arcName: 'Santé', name: '100 jours sans aliments transformés', targetValue: 100, targetType: TargetTypes.COUNT, xpReward: 1000, titleReward: 'Pur' },
];

