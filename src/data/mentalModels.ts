// Mental Models for Behavioural Marketing
// Based on persuasion psychology and behavioural economics

export interface MentalModel {
  id: string;
  name: string;
  description: string;
  application: string;
  examples: string[];
  kpiImpact: string[];
  contentFormats: string[];
}

export const MENTAL_MODELS: MentalModel[] = [
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'People follow the actions and opinions of others, especially in uncertain situations.',
    application: 'Showcase testimonials, user counts, case studies, and endorsements to build trust.',
    examples: [
      'Display "500+ organisations trust us" on landing pages',
      'Feature patient testimonials in health campaigns',
      'Show real-time sign-up counters for events',
      'Include logos of partner organisations',
    ],
    kpiImpact: ['Conversion Rate', 'Trust Score', 'Sign-up Rate'],
    contentFormats: ['case-study', 'social', 'email', 'video'],
  },
  {
    id: 'scarcity',
    name: 'Scarcity',
    description: 'People place higher value on things that are rare or limited in availability.',
    application: 'Create urgency through limited-time offers, capacity limits, or exclusive access.',
    examples: [
      '"Only 20 places remaining" for training sessions',
      '"Deadline: Friday 5pm" for grant applications',
      '"Limited pilot programme — apply now"',
      'Early-bird pricing for conferences',
    ],
    kpiImpact: ['Conversion Rate', 'Click-through Rate', 'Time to Action'],
    contentFormats: ['email', 'social', 'carousel'],
  },
  {
    id: 'authority',
    name: 'Authority',
    description: 'People are more likely to comply with requests from credible, expert sources.',
    application: 'Lead with expertise, qualifications, official endorsements, and data.',
    examples: [
      'Quote NHS guidance or NICE recommendations',
      'Feature expert clinician endorsements',
      'Lead with research statistics and citations',
      'Use official logos and accreditation badges',
    ],
    kpiImpact: ['Trust Score', 'Engagement Rate', 'Compliance Rate'],
    contentFormats: ['press-release', 'blog', 'newsletter', 'video'],
  },
  {
    id: 'reciprocity',
    name: 'Reciprocity',
    description: 'People feel obligated to return favours after receiving something valuable.',
    application: 'Offer value first — free resources, helpful content, or useful tools — before asking for action.',
    examples: [
      'Free toolkit downloads before asking for contact details',
      'Helpful webinars before promoting services',
      'Free consultations before recommending programmes',
      'Valuable newsletters before asking for engagement',
    ],
    kpiImpact: ['Lead Generation', 'Email Signups', 'Engagement Rate'],
    contentFormats: ['blog', 'newsletter', 'video', 'case-study'],
  },
  {
    id: 'loss-aversion',
    name: 'Loss Aversion',
    description: 'People feel losses more strongly than equivalent gains.',
    application: 'Frame messaging around what people might miss or lose rather than what they might gain.',
    examples: [
      '"Don\'t miss out on this funding opportunity"',
      '"Your patients could be missing vital support"',
      '"Staff burnout costs your trust £X per year"',
      '"Without this training, teams risk..."',
    ],
    kpiImpact: ['Conversion Rate', 'Click-through Rate', 'Urgency Response'],
    contentFormats: ['email', 'social', 'carousel'],
  },
  {
    id: 'commitment-bias',
    name: 'Commitment & Consistency',
    description: 'Once people commit to something small, they\'re more likely to stay consistent with larger commitments.',
    application: 'Start with small asks (newsletter signup, webinar attendance) before larger commitments (programme enrollment).',
    examples: [
      'Quick survey before full application',
      'Expression of interest before formal signup',
      'Pledge campaigns building to action',
      'Micro-commitments in onboarding flows',
    ],
    kpiImpact: ['Conversion Rate', 'Funnel Progression', 'Retention Rate'],
    contentFormats: ['email', 'social', 'newsletter'],
  },
  {
    id: 'narrative-transport',
    name: 'Narrative Transport',
    description: 'Stories captivate attention and reduce counter-arguing by immersing people in a narrative.',
    application: 'Lead with human stories, patient journeys, and personal experiences rather than dry facts.',
    examples: [
      'Patient journey videos showing transformation',
      'Staff spotlight stories in recruitment campaigns',
      'Day-in-the-life content for role promotion',
      'Community impact narratives for stakeholders',
    ],
    kpiImpact: ['Engagement Rate', 'Time on Page', 'Emotional Response', 'Share Rate'],
    contentFormats: ['video', 'blog', 'case-study', 'social'],
  },
  {
    id: 'anchoring',
    name: 'Anchoring',
    description: 'People rely heavily on the first piece of information they receive when making decisions.',
    application: 'Lead with the most impactful statistic or comparison to set expectations.',
    examples: [
      '"Normally £500, now free for NHS staff"',
      '"From 6 months to 6 weeks — our new pathway"',
      '"Join 50,000 healthcare professionals already using..."',
      'Compare before/after metrics prominently',
    ],
    kpiImpact: ['Perceived Value', 'Conversion Rate', 'Click-through Rate'],
    contentFormats: ['social', 'email', 'carousel', 'press-release'],
  },
  {
    id: 'mere-exposure',
    name: 'Mere Exposure Effect',
    description: 'Repeated exposure to something increases familiarity and liking.',
    application: 'Maintain consistent, repeated touchpoints across channels without being annoying.',
    examples: [
      'Multi-touchpoint campaign sequences',
      'Retargeting with consistent branding',
      'Monthly newsletter maintaining presence',
      'Regular social posting on key themes',
    ],
    kpiImpact: ['Brand Recall', 'Trust Score', 'Long-term Engagement'],
    contentFormats: ['social', 'email', 'newsletter'],
  },
  {
    id: 'default-effect',
    name: 'Default Effect',
    description: 'People tend to stick with pre-selected or default options.',
    application: 'Set beneficial defaults in forms, preferences, and enrolment options.',
    examples: [
      'Pre-tick newsletter signup (GDPR-compliant)',
      'Default to recommended training package',
      'Pre-fill forms with sensible defaults',
      'Highlight "Most Popular" or "Recommended" options',
    ],
    kpiImpact: ['Conversion Rate', 'Option Selection', 'Form Completion'],
    contentFormats: ['email', 'newsletter'],
  },
];

export const getMentalModelById = (id: string): MentalModel | undefined => 
  MENTAL_MODELS.find(m => m.id === id);

export const getMentalModelsForFormat = (format: string): MentalModel[] =>
  MENTAL_MODELS.filter(m => m.contentFormats.includes(format));

export const getMentalModelsForKpi = (kpi: string): MentalModel[] =>
  MENTAL_MODELS.filter(m => m.kpiImpact.some(k => k.toLowerCase().includes(kpi.toLowerCase())));
