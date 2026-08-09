import {
  Globe2,
  Rocket,
  DollarSign,
  Users,
  Swords,
  Megaphone,
  PiggyBank,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface InvestorQuestion {
  key: string;
  question: string;
  hint?: string;
}

export interface InvestorQuestionSection {
  key: string;
  title: string;
  icon: LucideIcon;
  questions: InvestorQuestion[];
}

/**
 * Canonical catalogue of the questions investors ask founders.
 * Keys are stable identifiers — never rename them, only the wording.
 */
export const INVESTOR_QUESTION_SECTIONS: InvestorQuestionSection[] = [
  {
    key: 'market',
    title: 'Market & Opportunity',
    icon: Globe2,
    questions: [
      { key: 'market_size', question: 'How big is the addressable market (TAM/SAM/SOM)?' },
      { key: 'market_trend', question: 'What trend is driving demand?' },
      { key: 'market_why_now', question: 'Why now?' },
    ],
  },
  {
    key: 'product',
    title: 'Product & Traction',
    icon: Rocket,
    questions: [
      { key: 'product_problem', question: 'What problem do you solve, and for whom?' },
      { key: 'product_traction', question: 'What traction do you have — revenue, users, growth rate, retention?' },
      { key: 'product_metrics', question: 'What are the key metrics (CAC, LTV, churn, activation)?' },
      { key: 'product_defensibility', question: 'Is the product defensible — IP, network effects, data moats?' },
    ],
  },
  {
    key: 'business_model',
    title: 'Business Model',
    icon: DollarSign,
    questions: [
      { key: 'model_revenue', question: 'How do you make money?' },
      { key: 'model_unit_economics', question: 'Unit economics — gross margin, payback period, breakeven point?' },
      { key: 'model_profitability', question: 'What does the path to profitability look like?' },
    ],
  },
  {
    key: 'team',
    title: 'Team',
    icon: Users,
    questions: [
      { key: 'team_why', question: 'Why is this team the right one to build this?' },
      { key: 'team_experience', question: 'What relevant experience do the founders have?' },
      { key: 'team_hiring', question: 'Who have you hired? Who do you still need?' },
    ],
  },
  {
    key: 'competition',
    title: 'Competition',
    icon: Swords,
    questions: [
      { key: 'competition_landscape', question: 'Who are your direct and indirect competitors?' },
      { key: 'competition_advantage', question: 'What is your sustainable competitive advantage?' },
      { key: 'competition_incumbents', question: "Why can't an incumbent copy you?" },
    ],
  },
  {
    key: 'gtm',
    title: 'Go-to-Market',
    icon: Megaphone,
    questions: [
      { key: 'gtm_acquisition', question: 'How do you acquire customers?' },
      { key: 'gtm_channels', question: 'What channels work today? What will scale?' },
      { key: 'gtm_sales_cycle', question: 'What does your sales cycle look like?' },
    ],
  },
  {
    key: 'financials',
    title: 'Financials & Funding',
    icon: PiggyBank,
    questions: [
      { key: 'funding_raise', question: 'How much are you raising, and what runway does it buy?' },
      { key: 'funding_milestones', question: 'What milestones will this round unlock?' },
      { key: 'funding_past_capital', question: 'How have you spent past capital?' },
      { key: 'funding_cap_table', question: 'Cap table, previous valuations, and investor rights?' },
    ],
  },
  {
    key: 'risk',
    title: 'Risk & Vision',
    icon: ShieldAlert,
    questions: [
      { key: 'risk_killers', question: 'What could kill this business?' },
      { key: 'risk_regulatory', question: 'What regulatory, technical, or market risks exist?' },
      { key: 'risk_vision', question: 'What does success look like in 5–10 years?' },
    ],
  },
];

export const TOTAL_INVESTOR_QUESTIONS = INVESTOR_QUESTION_SECTIONS.reduce(
  (total, section) => total + section.questions.length,
  0
);
