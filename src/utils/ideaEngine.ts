import { ContentIdea, ContentFormat, MarketingIdea, AwarenessEvent } from '../types';
import { MENTAL_MODELS } from '../data/mentalModels';
import { suggestMentalModel } from './intelligenceEngine';

interface IdeaGeneratorInput {
  audienceSegment: string;
  kpiObjective: string;
  contentFormat: ContentFormat;
  awarenessEvent?: AwarenessEvent;
  marketingIdeas: MarketingIdea[];
}

interface GeneratedIdea {
  title: string;
  description: string;
  format: ContentFormat;
  relatedIdeaId: string;
  mentalModel: string;
  suggestedCTA: string;
  engagementScore: number;
}

// CTA templates by KPI objective
const CTA_TEMPLATES: Record<string, string[]> = {
  conversion: ['Sign up now', 'Book your place today', 'Register before it\'s too late', 'Secure your spot'],
  engagement: ['Join the conversation', 'Share your experience', 'Tell us what you think', 'Get involved'],
  awareness: ['Learn more', 'Discover how', 'Find out why', 'Explore the opportunity'],
  lead: ['Download the guide', 'Get your free toolkit', 'Access the resource', 'Claim your copy'],
  retention: ['Stay connected', 'Renew your membership', 'Continue your journey', 'Keep your progress'],
  referral: ['Invite a colleague', 'Share with your team', 'Recommend a friend', 'Spread the word'],
};

// Generate content ideas based on inputs
export function generateContentIdeas(input: IdeaGeneratorInput): GeneratedIdea[] {
  const { audienceSegment, kpiObjective, contentFormat, awarenessEvent, marketingIdeas } = input;
  const ideas: GeneratedIdea[] = [];

  // Find relevant marketing ideas
  const relevantIdeas = findRelevantIdeas(marketingIdeas, kpiObjective, contentFormat);
  
  // Get mental model for this context
  const suggestedModel = suggestMentalModel(kpiObjective, contentFormat);
  const mentalModel = MENTAL_MODELS.find(m => m.id === suggestedModel) || MENTAL_MODELS[0];

  // Generate 5 ideas
  for (let i = 0; i < Math.min(5, relevantIdeas.length); i++) {
    const baseIdea = relevantIdeas[i];
    const idea = createContentIdea(baseIdea, audienceSegment, kpiObjective, contentFormat, mentalModel, awarenessEvent);
    ideas.push(idea);
  }

  // If we don't have enough, generate generic ones
  while (ideas.length < 5) {
    const genericIdea = createGenericIdea(audienceSegment, kpiObjective, contentFormat, mentalModel, awarenessEvent, ideas.length);
    ideas.push(genericIdea);
  }

  // Sort by engagement score
  return ideas.sort((a, b) => b.engagementScore - a.engagementScore);
}

function findRelevantIdeas(ideas: MarketingIdea[], kpiObjective: string, format: ContentFormat): MarketingIdea[] {
  const kpiLower = kpiObjective.toLowerCase();
  
  // Score ideas by relevance
  const scored = ideas.map(idea => {
    let score = 0;
    
    // KPI match
    if (idea.primaryKPI.toLowerCase().includes(kpiLower) || kpiLower.includes(idea.primaryKPI.toLowerCase())) {
      score += 30;
    }
    if (idea.secondaryKPI.toLowerCase().includes(kpiLower)) {
      score += 15;
    }
    
    // Category relevance
    if (kpiLower.includes('conversion') && (idea.category === 'acquisition' || idea.category === 'activation')) {
      score += 20;
    }
    if (kpiLower.includes('engagement') && idea.category === 'engagement') {
      score += 25;
    }
    if (kpiLower.includes('referral') && idea.category === 'referral') {
      score += 25;
    }
    if (kpiLower.includes('retention') && idea.category === 'retention') {
      score += 25;
    }
    
    // Format compatibility
    const formatCompatibility: Record<ContentFormat, string[]> = {
      'blog': ['content', 'authority', 'engagement'],
      'email': ['retention', 'acquisition', 'referral'],
      'social': ['engagement', 'community', 'acquisition'],
      'carousel': ['engagement', 'community'],
      'video': ['engagement', 'authority', 'community'],
      'newsletter': ['retention', 'engagement'],
      'press-release': ['authority', 'partnerships'],
      'case-study': ['authority', 'referral', 'engagement'],
    };
    
    if (formatCompatibility[format]?.includes(idea.category)) {
      score += 15;
    }
    
    // Prefer activated ideas with good performance
    if (idea.status === 'completed' && (idea.performanceScore || 0) > 70) {
      score += 10;
    }
    
    return { idea, score };
  });

  // Sort by score and return top ideas
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(s => s.idea);
}

function createContentIdea(
  baseIdea: MarketingIdea,
  audience: string,
  kpiObjective: string,
  format: ContentFormat,
  mentalModel: typeof MENTAL_MODELS[0],
  awarenessEvent?: AwarenessEvent
): GeneratedIdea {
  const ctaPool = getCTAPool(kpiObjective);
  const cta = ctaPool[Math.floor(Math.random() * ctaPool.length)];
  
  // Build title incorporating awareness event if present
  let title = generateTitle(baseIdea.name, audience, format, awarenessEvent);
  
  // Build description
  let description = `Create a ${format} targeting ${audience} based on the "${baseIdea.name}" strategy. `;
  description += `This approach leverages ${mentalModel.name.toLowerCase()} principles to ${kpiObjective.toLowerCase()}. `;
  if (awarenessEvent) {
    description += `Tie into ${awarenessEvent.name} for increased relevance and timeliness.`;
  }

  // Calculate engagement score
  const engagementScore = calculateEngagementScore(baseIdea, format, awarenessEvent);

  return {
    title,
    description,
    format,
    relatedIdeaId: baseIdea.id,
    mentalModel: mentalModel.id,
    suggestedCTA: cta,
    engagementScore,
  };
}

function createGenericIdea(
  audience: string,
  kpiObjective: string,
  format: ContentFormat,
  mentalModel: typeof MENTAL_MODELS[0],
  awarenessEvent: AwarenessEvent | undefined,
  index: number
): GeneratedIdea {
  const ctaPool = getCTAPool(kpiObjective);
  const cta = ctaPool[index % ctaPool.length];
  
  const genericTitles: Record<ContentFormat, string[]> = {
    'blog': ['Thought leadership piece', 'Expert guide', 'How-to tutorial', 'Industry insights', 'Best practices roundup'],
    'email': ['Personalised outreach', 'Newsletter feature', 'Action-focused email', 'Welcome sequence', 'Re-engagement campaign'],
    'social': ['Engagement post', 'Story series', 'Community highlight', 'Interactive poll', 'User spotlight'],
    'carousel': ['Educational carousel', 'Step-by-step guide', 'Myth vs fact', 'Tips series', 'Data visualization'],
    'video': ['Explainer video', 'Interview feature', 'Behind the scenes', 'Tutorial walkthrough', 'Success story'],
    'newsletter': ['Monthly digest', 'Curated insights', 'Team spotlight', 'Upcoming highlights', 'Resources roundup'],
    'press-release': ['Announcement', 'Partnership news', 'Milestone celebration', 'Innovation reveal', 'Impact report'],
    'case-study': ['Success story', 'Impact analysis', 'Transformation journey', 'Results showcase', 'Lessons learned'],
  };

  const titles = genericTitles[format] || genericTitles.blog;
  let title = `${titles[index % titles.length]} for ${audience}`;
  if (awarenessEvent) {
    title = `${awarenessEvent.name}: ${titles[index % titles.length]}`;
  }

  return {
    title,
    description: `Create ${format} content for ${audience} focused on ${kpiObjective}. Apply ${mentalModel.name} principles.`,
    format,
    relatedIdeaId: '',
    mentalModel: mentalModel.id,
    suggestedCTA: cta,
    engagementScore: 5 + Math.random() * 3, // Generic ideas score lower
  };
}

function generateTitle(baseName: string, audience: string, format: ContentFormat, event?: AwarenessEvent): string {
  const formatPrefixes: Record<ContentFormat, string> = {
    'blog': 'Article:',
    'email': 'Email campaign:',
    'social': 'Social series:',
    'carousel': 'Carousel:',
    'video': 'Video:',
    'newsletter': 'Newsletter:',
    'press-release': 'Press release:',
    'case-study': 'Case study:',
  };

  let title = `${formatPrefixes[format]} ${baseName}`;
  
  if (event) {
    title = `${event.name} — ${baseName}`;
  }
  
  if (audience && !title.toLowerCase().includes(audience.toLowerCase())) {
    title += ` for ${audience}`;
  }

  return title;
}

function getCTAPool(kpiObjective: string): string[] {
  const kpi = kpiObjective.toLowerCase();
  
  if (kpi.includes('conversion') || kpi.includes('signup') || kpi.includes('booking')) {
    return CTA_TEMPLATES.conversion;
  }
  if (kpi.includes('engagement')) {
    return CTA_TEMPLATES.engagement;
  }
  if (kpi.includes('lead') || kpi.includes('download')) {
    return CTA_TEMPLATES.lead;
  }
  if (kpi.includes('retention') || kpi.includes('loyalty')) {
    return CTA_TEMPLATES.retention;
  }
  if (kpi.includes('referral')) {
    return CTA_TEMPLATES.referral;
  }
  
  return CTA_TEMPLATES.awareness;
}

function calculateEngagementScore(idea: MarketingIdea, format: ContentFormat, event?: AwarenessEvent): number {
  let score = 5;
  
  // Base score from idea performance
  if (idea.performanceScore) {
    score += (idea.performanceScore / 100) * 3;
  }
  
  // Format boost
  const formatBoosts: Record<ContentFormat, number> = {
    'video': 1.5,
    'carousel': 1.2,
    'case-study': 1.3,
    'social': 1.1,
    'blog': 1.0,
    'email': 0.9,
    'newsletter': 0.8,
    'press-release': 0.7,
  };
  score *= formatBoosts[format] || 1;
  
  // Awareness event boost
  if (event) {
    score += 1.5;
  }
  
  // Cap at 10
  return Math.min(10, Math.round(score * 10) / 10);
}

// Generate headline using conversion formula
export function generateHeadline(idea: ContentIdea, audience: string): string {
  const templates = [
    `How ${audience} Can ${idea.title.split(':').pop()?.trim() || idea.title}`,
    `The ${audience}'s Guide to ${idea.title.split(':').pop()?.trim() || 'Success'}`,
    `Why ${audience} Should ${idea.suggestedCTA.replace(/^(Sign up|Book|Register|Download|Get|Access|Claim)/i, 'Consider').toLowerCase()}`,
    `${audience}: Here's What You Need to Know About ${idea.title.split(':').pop()?.trim() || 'This'}`,
    `Transform Your Approach: ${idea.title} Explained`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate outline sections
export function generateOutline(idea: ContentIdea, kpiGoal: string): { section: string; content: string }[] {
  const baseOutline = [
    { section: 'Hook / Introduction', content: `Open with a compelling problem statement or statistic relevant to ${idea.audience}. Create immediate connection.` },
    { section: 'Context & Background', content: `Explain why this matters now. Reference any awareness events or timely factors.` },
    { section: 'Key Message / Value Proposition', content: `Present the core insight or solution. Apply ${idea.mentalModel || 'social proof'} principles here.` },
    { section: 'Supporting Evidence', content: `Include data points, testimonials, or case studies that reinforce the message.` },
    { section: 'Call to Action', content: `Clear, specific CTA: "${idea.suggestedCTA}". Link directly to ${kpiGoal.toLowerCase()} action.` },
  ];

  return baseOutline;
}
