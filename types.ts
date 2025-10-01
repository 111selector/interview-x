export enum Screen {
  LANDING,
  LOGIN,
  DASHBOARD,
  PLANS,
  PAYMENT,
  SETUP,
  INTERVIEW,
  FEEDBACK,
  PROFILE,
  TEST,
  TEST_RESULTS,
}

export enum Plan {
  FREE = 'Free',
  STANDARD = 'Standard',
  PRO = 'Pro',
  PREMIUM = 'Premium',
}

export interface User {
  name: string;
  email: string;
  profilePicture?: string;
  plan: Plan;
  progress: 'Beginner' | 'Intermediate' | 'Advanced';
  interviewsCompleted: number;
  downloadsUsed: number;
}

export interface Language {
    code: string;
    name: string;
}

export enum InterviewPhase {
  SETUP,
  INTERVIEW,
  FEEDBACK,
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
}

export interface InterviewData {
  companyName: string;
  jobRole: string;
  companyUrl: string;
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
}

export interface PausedInterview {
    interviewData: InterviewData;
    messages: ChatMessage[];
    language: string;
}

export interface TestQuestion {
    id: string;
    question: string;
    options: string[];
}

export interface UserAnswer {
    questionId: string;
    answer: string;
}

export interface TestResult {
    score: number; // percentage
    feedback: string;
    passed: boolean;
}