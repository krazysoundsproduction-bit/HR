export type JobPostingType = 'full-time' | 'part-time' | 'contract';
export type JobPostingStatus = 'draft' | 'open' | 'closed' | 'filled';
export type ApplicantStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
export type InterviewType = 'phone' | 'video' | 'in-person';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  position: string;
  description: string;
  requirements: string[];
  type: JobPostingType;
  status: JobPostingStatus;
  postedBy: string;
  closingDate: string;
  salary: number;
}

export interface Applicant {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicantStatus;
  appliedAt: string;
  notes?: string;
}

export interface Interview {
  id: string;
  applicantId: string;
  jobId: string;
  scheduledAt: string;
  interviewers: string[];
  type: InterviewType;
  status: InterviewStatus;
  feedback?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  recommendHire?: boolean;
}

export interface OfferLetter {
  id: string;
  applicantId: string;
  jobId: string;
  salary: number;
  startDate: string;
  position: string;
  department: string;
  status: OfferStatus;
  sentAt?: string;
  respondedAt?: string;
  notes?: string;
}
