import { AwarenessEvent } from '../types';

export const AWARENESS_EVENTS: AwarenessEvent[] = [
  // January
  { id: 'ae1', name: 'Dry January', date: '2025-01-01', endDate: '2025-01-31', category: 'Health', description: 'Month-long alcohol-free challenge raising awareness about drinking habits.', suggestedIdeas: ['m23', 'm45', 'm67'] },
  { id: 'ae2', name: 'Veganuary', date: '2025-01-01', endDate: '2025-01-31', category: 'Health', description: 'Month encouraging people to try vegan diet for health and environment.', suggestedIdeas: ['m34', 'm56'] },
  { id: 'ae3', name: 'Holocaust Memorial Day', date: '2025-01-27', category: 'Memorial', description: 'Remembering the Holocaust and subsequent genocides.', suggestedIdeas: ['m12', 'm89'] },
  
  // February
  { id: 'ae4', name: 'Time to Talk Day', date: '2025-02-06', category: 'Mental Health', description: 'Breaking the silence around mental health through conversations.', suggestedIdeas: ['m11', 'm33', 'm78'] },
  { id: 'ae5', name: 'World Cancer Day', date: '2025-02-04', category: 'Health', description: 'Raising awareness about cancer prevention, detection, and treatment.', suggestedIdeas: ['m22', 'm44', 'm88'] },
  { id: 'ae6', name: 'LGBT+ History Month', date: '2025-02-01', endDate: '2025-02-28', category: 'Equality', description: 'Celebrating LGBT+ history and promoting equality.', suggestedIdeas: ['m55', 'm77'] },
  
  // March
  { id: 'ae7', name: 'Neurodiversity Celebration Week', date: '2025-03-17', endDate: '2025-03-23', category: 'Inclusion', description: 'Recognising neurodivergent talents and celebrating different ways of thinking.', suggestedIdeas: ['m66', 'm99', 'm101'] },
  { id: 'ae8', name: 'International Women\'s Day', date: '2025-03-08', category: 'Equality', description: 'Celebrating women\'s achievements and advocating for equality.', suggestedIdeas: ['m77', 'm88', 'm102'] },
  { id: 'ae9', name: 'World Social Work Day', date: '2025-03-18', category: 'Professional', description: 'Recognising the contribution of social workers worldwide.', suggestedIdeas: ['m33', 'm55'] },
  
  // April
  { id: 'ae10', name: 'Stress Awareness Month', date: '2025-04-01', endDate: '2025-04-30', category: 'Mental Health', description: 'Month dedicated to increasing public awareness about stress causes and cures.', suggestedIdeas: ['m11', 'm22', 'm33'] },
  { id: 'ae11', name: 'Autism Acceptance Month', date: '2025-04-01', endDate: '2025-04-30', category: 'Inclusion', description: 'Promoting understanding, acceptance and support for autistic individuals.', suggestedIdeas: ['m66', 'm77', 'm99'] },
  { id: 'ae12', name: 'World Health Day', date: '2025-04-07', category: 'Health', description: 'Annual WHO campaign focusing on a specific health theme.', suggestedIdeas: ['m12', 'm34', 'm56'] },
  
  // May
  { id: 'ae13', name: 'Mental Health Awareness Week', date: '2025-05-12', endDate: '2025-05-18', category: 'Mental Health', description: 'UK\'s biggest mental health awareness campaign by the Mental Health Foundation.', suggestedIdeas: ['m11', 'm22', 'm33', 'm44'] },
  { id: 'ae14', name: 'Dementia Action Week', date: '2025-05-19', endDate: '2025-05-25', category: 'Health', description: 'Alzheimer\'s Society campaign to encourage action around dementia.', suggestedIdeas: ['m45', 'm67', 'm89'] },
  { id: 'ae15', name: 'International Nurses Day', date: '2025-05-12', category: 'Professional', description: 'Celebrating and honouring nurses worldwide.', suggestedIdeas: ['m88', 'm101', 'm102'] },
  
  // June
  { id: 'ae16', name: 'Volunteers\' Week', date: '2025-06-01', endDate: '2025-06-07', category: 'Community', description: 'Celebrating and thanking volunteers for their contribution.', suggestedIdeas: ['m55', 'm66', 'm77'] },
  { id: 'ae17', name: 'Pride Month', date: '2025-06-01', endDate: '2025-06-30', category: 'Equality', description: 'Celebrating LGBTQ+ communities and raising awareness for equality.', suggestedIdeas: ['m77', 'm88', 'm99'] },
  { id: 'ae18', name: 'Carers Week', date: '2025-06-09', endDate: '2025-06-15', category: 'Care', description: 'Annual campaign to raise awareness of caring and recognise carers.', suggestedIdeas: ['m33', 'm44', 'm55'] },
  
  // July
  { id: 'ae19', name: 'NHS Birthday', date: '2025-07-05', category: 'Healthcare', description: 'Celebrating the founding of the NHS and its staff.', suggestedIdeas: ['m101', 'm102', 'm103'] },
  { id: 'ae20', name: 'Samaritans Awareness Day', date: '2025-07-24', category: 'Mental Health', description: 'Raising awareness about Samaritans\' suicide prevention work.', suggestedIdeas: ['m11', 'm22'] },
  
  // August
  { id: 'ae21', name: 'World Breastfeeding Week', date: '2025-08-01', endDate: '2025-08-07', category: 'Health', description: 'Encouraging breastfeeding and improving infant health.', suggestedIdeas: ['m34', 'm45'] },
  
  // September
  { id: 'ae22', name: 'World Suicide Prevention Day', date: '2025-09-10', category: 'Mental Health', description: 'Raising awareness about suicide prevention strategies.', suggestedIdeas: ['m11', 'm22', 'm33'] },
  { id: 'ae23', name: 'World Alzheimer\'s Day', date: '2025-09-21', category: 'Health', description: 'International campaign to raise dementia awareness.', suggestedIdeas: ['m45', 'm67', 'm89'] },
  { id: 'ae24', name: 'World Heart Day', date: '2025-09-29', category: 'Health', description: 'Promoting cardiovascular health and heart disease prevention.', suggestedIdeas: ['m23', 'm34'] },
  
  // October
  { id: 'ae25', name: 'World Mental Health Day', date: '2025-10-10', category: 'Mental Health', description: 'WHO campaign raising mental health awareness globally.', suggestedIdeas: ['m11', 'm22', 'm33', 'm44'] },
  { id: 'ae26', name: 'Black History Month', date: '2025-10-01', endDate: '2025-10-31', category: 'Equality', description: 'Celebrating Black history, heritage and culture.', suggestedIdeas: ['m77', 'm88', 'm99'] },
  { id: 'ae27', name: 'Breast Cancer Awareness Month', date: '2025-10-01', endDate: '2025-10-31', category: 'Health', description: 'Raising awareness about breast cancer screening and treatment.', suggestedIdeas: ['m22', 'm44', 'm66'] },
  { id: 'ae28', name: 'Stoptober', date: '2025-10-01', endDate: '2025-10-31', category: 'Health', description: 'Public Health England\'s 28-day stop smoking challenge.', suggestedIdeas: ['m23', 'm45'] },
  
  // November
  { id: 'ae29', name: 'Movember', date: '2025-11-01', endDate: '2025-11-30', category: 'Health', description: 'Raising awareness about men\'s health issues.', suggestedIdeas: ['m11', 'm22', 'm34'] },
  { id: 'ae30', name: 'Anti-Bullying Week', date: '2025-11-17', endDate: '2025-11-21', category: 'Wellbeing', description: 'Raising awareness of bullying and promoting kindness.', suggestedIdeas: ['m55', 'm66'] },
  { id: 'ae31', name: 'Safeguarding Adults Week', date: '2025-11-17', endDate: '2025-11-23', category: 'Safeguarding', description: 'Promoting awareness of adult safeguarding.', suggestedIdeas: ['m89', 'm101'] },
  
  // December
  { id: 'ae32', name: 'World AIDS Day', date: '2025-12-01', category: 'Health', description: 'International day dedicated to raising HIV/AIDS awareness.', suggestedIdeas: ['m22', 'm44'] },
  { id: 'ae33', name: 'International Day of Persons with Disabilities', date: '2025-12-03', category: 'Inclusion', description: 'Promoting rights and wellbeing of persons with disabilities.', suggestedIdeas: ['m66', 'm77', 'm99'] },
  
  // Year-round campaigns
  { id: 'ae34', name: 'Young Carers Awareness Day', date: '2025-01-30', category: 'Care', description: 'Raising awareness about young carers\' needs and challenges.', suggestedIdeas: ['m33', 'm44', 'm55'] },
  { id: 'ae35', name: 'Eating Disorders Awareness Week', date: '2025-02-24', endDate: '2025-03-02', category: 'Mental Health', description: 'Raising awareness about eating disorders and support available.', suggestedIdeas: ['m11', 'm22', 'm33'] },
];

export const getUpcomingEvents = (days: number = 30): AwarenessEvent[] => {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return AWARENESS_EVENTS.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= future;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getEventsForMonth = (month: number, year: number): AwarenessEvent[] => {
  return AWARENESS_EVENTS.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === month && eventDate.getFullYear() === year;
  });
};

export const getEventsByCategory = (category: string): AwarenessEvent[] => {
  return AWARENESS_EVENTS.filter(e => e.category.toLowerCase() === category.toLowerCase());
};
