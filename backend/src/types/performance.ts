export type ReviewCycleStatus = 'planning' | 'active' | 'completed';
export type ReviewType = 'self' | 'manager' | 'peer' | '360';
export type PerformanceReviewStatus = 'pending' | 'in-progress' | 'submitted' | 'acknowledged';
export type GoalStatus = 'active' | 'completed' | 'missed' | 'cancelled';
export type FeedbackType = 'praise' | 'constructive' | 'general';
export type FeedbackVisibility = 'private' | 'public';
export type DevelopmentPlanStatus = 'active' | 'completed';

export interface ReviewCycle {
  id: string;
  name: string;
  year: number;
  quarter: number;
  status: ReviewCycleStatus;
  startDate: string;
  endDate: string;
  createdBy: string;
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  type: ReviewType;
  status: PerformanceReviewStatus;
  overallRating?: 1 | 2 | 3 | 4 | 5;
  strengths?: string;
  improvements?: string;
  comments?: string;
  submittedAt?: string;
  acknowledgedAt?: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  targetDate: string;
  status: GoalStatus;
  progress: number;
  category: string;
  createdBy: string;
}

export interface Feedback {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  type: FeedbackType;
  content: string;
  visibility: FeedbackVisibility;
  createdAt: string;
}

export interface DevelopmentPlan {
  id: string;
  employeeId: string;
  reviewId: string;
  skills: string[];
  actions: string[];
  targetDate: string;
  status: DevelopmentPlanStatus;
}
