export interface PostTemplate {
  id: string;
  title: string;
  category: 'hooks' | 'announcements' | 'growth' | 'engagement' | 'custom';
  description: string;
  content: string;
  isCustom?: boolean;
}

export const BUILT_IN_TEMPLATES: PostTemplate[] = [
  // Hooks & Frameworks
  {
    id: 'contrarian-truth',
    title: 'The Contrarian Truth',
    category: 'hooks',
    description: 'Challenge common industry advice and present a battle-tested alternative.',
    content: `Most people think [Common Industry Belief].

After [X years / spending $Y], here is what actually works:

1. [Key Insight #1]
2. [Key Insight #2]
3. [Key Insight #3]

Don't sleep on #[Topic].`,
  },
  {
    id: 'transformation-story',
    title: 'From A to B Transformation',
    category: 'hooks',
    description: 'High-converting personal or startup growth journey with practical takeaways.',
    content: `In [Past Year], I had [Struggling Situation].

Today, [Impressive Current Milestone].

Here are the 3 non-obvious lessons that changed everything:

• [Lesson 1: Focus on X]
• [Lesson 2: Stop doing Y]
• [Lesson 3: Consistency in Z]

Which one resonates most with you?`,
  },
  {
    id: 'resource-curation',
    title: 'The 10x Resource Stack',
    category: 'growth',
    description: 'Bookmark-worthy curated list of high-utility tools or websites.',
    content: `10 tools that will save you 20 hours a week (bookmark this 🔖):

1. @[Tool1] — [One-line benefit]
2. @[Tool2] — [One-line benefit]
3. @[Tool3] — [One-line benefit]
4. @[Tool4] — [One-line benefit]
5. @[Tool5] — [One-line benefit]

Which one did I miss? Drop your favorite below 👇`,
  },
  {
    id: 'post-mortem',
    title: 'The Honest Post-Mortem',
    category: 'hooks',
    description: 'Share a failure or misstep and the valuable lessons gained.',
    content: `I spent [X months / $Y] building [Project / Campaign].

It didn't work.

Here are the 4 brutal mistakes I won't make again:

1. [Mistake 1: Validating too late]
2. [Mistake 2: Overcomplicating V1]
3. [Mistake 3: Ignoring early distribution]
4. [Mistake 4: Not talking to users daily]

Build in public, fail fast, repeat.`,
  },

  // Product & Company Announcements
  {
    id: 'feature-launch',
    title: 'Major Feature Launch',
    category: 'announcements',
    description: 'Clean, high-impact product announcement with bullet points and CTA.',
    content: `🚀 Introducing [Feature Name] on @[Company]!

Here's why you'll love it:
→ [Core Benefit 1: Save 5 hours/week]
→ [Core Benefit 2: Seamless multi-account dispatch]
→ [Core Benefit 3: Instant live telemetry]

Available right now for all users.
Try it today: [Link] (feedback is welcome!)`,
  },
  {
    id: 'milestone-celebration',
    title: 'Milestone Celebration',
    category: 'announcements',
    description: 'Celebrate reaching a target with appreciation for your community.',
    content: `Big milestone reached today: [We just crossed 1,000 users / $10k MRR]! 🎉

Huge gratitude to everyone who believed in us early and tested our beta. We are just getting started.

Next stop: [Upcoming Goal] 🚀`,
  },
  {
    id: 'hiring-call',
    title: 'We are Hiring!',
    category: 'announcements',
    description: 'Engaging talent recruitment post highlighting mission and perks.',
    content: `We're expanding the team! 💼

We're looking for an exceptional [Role Title] to join @[Company].

What you'll work on:
• [Key responsibility 1]
• [Key responsibility 2]

100% remote • Competitive equity • World-class team.
DM me or apply here: [Link]`,
  },

  // Engagement & Conversations
  {
    id: 'community-question',
    title: 'The Friday Roundtable',
    category: 'engagement',
    description: 'Drive high-volume replies with a simple, high-interest question.',
    content: `What is one tool or software habit that made you 10x more productive this week?

Drop it below — compiling the top answers for everyone 👇`,
  },
  {
    id: 'unpopular-opinion',
    title: 'Unpopular Opinion',
    category: 'engagement',
    description: 'Spark debate and engagement with a spicy or insightful perspective.',
    content: `Unpopular opinion:

[Controversial but insightful thought on your industry].

Agree or disagree? Tell me why I'm wrong.`,
  },
];

