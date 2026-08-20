import { Router } from 'express';
import { z } from 'zod';
import { db, id, nowIso } from '../data/store.js';
import { requireRole } from './middleware.js';

const router = Router();

const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const jobPostingSchema = z.object({
  title: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()).default([]),
  type: z.enum(['full-time', 'part-time', 'contract']),
  status: z.enum(['draft', 'open', 'closed', 'filled']).default('draft'),
  postedBy: z.string().min(1).default('hr'),
  closingDate: z.string().min(1),
  salary: z.number().nonnegative(),
});

const jobPostingUpdateSchema = jobPostingSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required',
});

const applicantSchema = z.object({
  jobId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  resumeUrl: z.string().min(1),
  coverLetter: z.string().optional(),
  notes: z.string().optional(),
});

const applicantStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
});

const interviewSchema = z.object({
  applicantId: z.string().min(1),
  jobId: z.string().min(1),
  scheduledAt: z.string().min(1),
  interviewers: z.array(z.string()).min(1),
  type: z.enum(['phone', 'video', 'in-person']),
});

const interviewCompleteSchema = z.object({
  feedback: z.string().min(1),
  rating: ratingSchema,
  recommendHire: z.boolean(),
  status: z.enum(['completed', 'cancelled']).default('completed'),
});

const offerSchema = z.object({
  applicantId: z.string().min(1),
  jobId: z.string().min(1),
  salary: z.number().nonnegative(),
  startDate: z.string().min(1),
  position: z.string().min(1),
  department: z.string().min(1),
  notes: z.string().optional(),
});

const offerResponseSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  notes: z.string().optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const paginate = <T,>(items: T[], query: unknown) => {
  const { limit, offset } = paginationSchema.parse(query);
  return {
    total: items.length,
    limit,
    offset,
    items: items.slice(offset, offset + limit),
  };
};

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('recruit_audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.recruitmentAudits.set(event.id, event);
  db.auditLogs.set(event.id, event);
};

router.post('/jobs', requireRole(['hr']), (req, res) => {
  const parsed = jobPostingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const job = { id: id('job'), ...parsed.data };
  db.jobPostings.set(job.id, job);
  audit('job_posting', job.id, 'create', req.header('x-employee-id') || job.postedBy, job);
  return res.status(201).json(job);
});

router.get('/jobs', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const department = typeof req.query.department === 'string' ? req.query.department : undefined;
  const jobs = [...db.jobPostings.values()].filter((job) => {
    if (status && job.status !== status) return false;
    if (department && job.department !== department) return false;
    return true;
  });
  return res.json(paginate(jobs.sort((a, b) => b.closingDate.localeCompare(a.closingDate)), req.query));
});

router.get('/jobs/:id', (req, res) => {
  const job = db.jobPostings.get(String(req.params.id));
  if (!job) {
    return res.status(404).json({ error: 'Job posting not found' });
  }
  const applicantsCount = [...db.applicants.values()].filter((applicant) => applicant.jobId === job.id).length;
  return res.json({ ...job, applicantsCount });
});

router.patch('/jobs/:id', requireRole(['hr']), (req, res) => {
  const job = db.jobPostings.get(String(req.params.id));
  if (!job) {
    return res.status(404).json({ error: 'Job posting not found' });
  }
  const parsed = jobPostingUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...job, ...parsed.data };
  db.jobPostings.set(updated.id, updated);
  audit('job_posting', updated.id, 'update', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.post('/jobs/:id/close', requireRole(['hr']), (req, res) => {
  const job = db.jobPostings.get(String(req.params.id));
  if (!job) {
    return res.status(404).json({ error: 'Job posting not found' });
  }
  const updated = { ...job, status: 'closed' as const };
  db.jobPostings.set(updated.id, updated);
  audit('job_posting', updated.id, 'close', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.post('/applicants', (req, res) => {
  const parsed = applicantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const job = db.jobPostings.get(parsed.data.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job posting not found' });
  }
  const applicant = {
    id: id('applicant'),
    ...parsed.data,
    status: 'applied' as const,
    appliedAt: nowIso(),
  };
  db.applicants.set(applicant.id, applicant);
  audit('applicant', applicant.id, 'create', applicant.email, applicant);
  return res.status(201).json(applicant);
});

router.get('/applicants', requireRole(['hr', 'manager']), (req, res) => {
  const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const applicants = [...db.applicants.values()].filter((applicant) => {
    if (jobId && applicant.jobId !== jobId) return false;
    if (status && applicant.status !== status) return false;
    return true;
  });
  return res.json(paginate(applicants.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), req.query));
});

router.get('/applicants/:id', requireRole(['hr', 'manager']), (req, res) => {
  const applicant = db.applicants.get(String(req.params.id));
  if (!applicant) {
    return res.status(404).json({ error: 'Applicant not found' });
  }
  const interviews = [...db.interviews.values()].filter((interview) => interview.applicantId === applicant.id);
  const offers = [...db.offerLetters.values()].filter((offer) => offer.applicantId === applicant.id);
  return res.json({ ...applicant, interviews, offers });
});

router.patch('/applicants/:id/status', requireRole(['hr', 'manager']), (req, res) => {
  const applicant = db.applicants.get(String(req.params.id));
  if (!applicant) {
    return res.status(404).json({ error: 'Applicant not found' });
  }
  const parsed = applicantStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...applicant, status: parsed.data.status, notes: parsed.data.notes ?? applicant.notes };
  db.applicants.set(updated.id, updated);
  audit('applicant', updated.id, 'status_update', req.header('x-employee-id') || 'manager', updated);
  return res.json(updated);
});

router.post('/interviews', requireRole(['hr', 'manager']), (req, res) => {
  const parsed = interviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const applicant = db.applicants.get(parsed.data.applicantId);
  const job = db.jobPostings.get(parsed.data.jobId);
  if (!applicant || !job) {
    return res.status(404).json({ error: 'Applicant or job posting not found' });
  }
  const interview = {
    id: id('interview'),
    ...parsed.data,
    status: 'scheduled' as const,
  };
  db.interviews.set(interview.id, interview);
  const updatedApplicant = { ...applicant, status: 'interview' as const };
  db.applicants.set(updatedApplicant.id, updatedApplicant);
  audit('interview', interview.id, 'create', req.header('x-employee-id') || 'manager', interview);
  return res.status(201).json(interview);
});

router.get('/interviews', requireRole(['hr', 'manager']), (req, res) => {
  const applicantId = typeof req.query.applicantId === 'string' ? req.query.applicantId : undefined;
  const items = [...db.interviews.values()].filter((interview) => !applicantId || interview.applicantId === applicantId);
  return res.json(paginate(items.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)), req.query));
});

router.get('/interviews/:id', requireRole(['hr', 'manager']), (req, res) => {
  const interview = db.interviews.get(String(req.params.id));
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  return res.json(interview);
});

router.patch('/interviews/:id/complete', requireRole(['hr', 'manager']), (req, res) => {
  const interview = db.interviews.get(String(req.params.id));
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  const parsed = interviewCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...interview, ...parsed.data };
  db.interviews.set(updated.id, updated);
  audit('interview', updated.id, 'complete', req.header('x-employee-id') || 'manager', updated);
  return res.json(updated);
});

router.post('/offers', requireRole(['hr']), (req, res) => {
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const applicant = db.applicants.get(parsed.data.applicantId);
  if (!applicant) {
    return res.status(404).json({ error: 'Applicant not found' });
  }
  const offer = {
    id: id('offer'),
    ...parsed.data,
    status: 'draft' as const,
  };
  db.offerLetters.set(offer.id, offer);
  db.applicants.set(applicant.id, { ...applicant, status: 'offer' as const });
  audit('offer_letter', offer.id, 'create', req.header('x-employee-id') || 'hr', offer);
  return res.status(201).json(offer);
});

router.get('/offers', requireRole(['hr', 'manager']), (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const items = [...db.offerLetters.values()].filter((offer) => !status || offer.status === status);
  return res.json(paginate(items.sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')), req.query));
});

router.patch('/offers/:id/send', requireRole(['hr']), (req, res) => {
  const offer = db.offerLetters.get(String(req.params.id));
  if (!offer) {
    return res.status(404).json({ error: 'Offer letter not found' });
  }
  const updated = { ...offer, status: 'sent' as const, sentAt: nowIso() };
  db.offerLetters.set(updated.id, updated);
  audit('offer_letter', updated.id, 'send', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.patch('/offers/:id/respond', requireRole(['hr']), (req, res) => {
  const offer = db.offerLetters.get(String(req.params.id));
  if (!offer) {
    return res.status(404).json({ error: 'Offer letter not found' });
  }
  const parsed = offerResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const applicant = db.applicants.get(offer.applicantId);
  const job = db.jobPostings.get(offer.jobId);
  const updated = {
    ...offer,
    status: parsed.data.status,
    respondedAt: nowIso(),
    notes: parsed.data.notes ?? offer.notes,
  };
  db.offerLetters.set(updated.id, updated);
  if (applicant) {
    db.applicants.set(applicant.id, {
      ...applicant,
      status: parsed.data.status === 'accepted' ? 'hired' : 'rejected',
    });
  }
  if (job && parsed.data.status === 'accepted') {
    db.jobPostings.set(job.id, { ...job, status: 'filled' as const });
  }
  audit('offer_letter', updated.id, 'respond', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.get('/pipeline', requireRole(['hr', 'manager']), (_req, res) => {
  const applicants = [...db.applicants.values()];
  const interviews = [...db.interviews.values()];
  const offers = [...db.offerLetters.values()];
  const applied = applicants.length || 1;
  const stageCount = (status: string) => applicants.filter((applicant) => applicant.status === status).length;
  return res.json({
    jobs: {
      total: db.jobPostings.size,
      open: [...db.jobPostings.values()].filter((job) => job.status === 'open').length,
      closed: [...db.jobPostings.values()].filter((job) => job.status === 'closed').length,
      filled: [...db.jobPostings.values()].filter((job) => job.status === 'filled').length,
    },
    applicants: {
      total: applicants.length,
      byStatus: {
        applied: stageCount('applied'),
        screening: stageCount('screening'),
        interview: stageCount('interview'),
        offer: stageCount('offer'),
        hired: stageCount('hired'),
        rejected: stageCount('rejected'),
      },
    },
    interviews: {
      scheduled: interviews.filter((interview) => interview.status === 'scheduled').length,
      completed: interviews.filter((interview) => interview.status === 'completed').length,
      cancelled: interviews.filter((interview) => interview.status === 'cancelled').length,
    },
    offers: {
      draft: offers.filter((offer) => offer.status === 'draft').length,
      sent: offers.filter((offer) => offer.status === 'sent').length,
      accepted: offers.filter((offer) => offer.status === 'accepted').length,
      rejected: offers.filter((offer) => offer.status === 'rejected').length,
    },
    conversionRates: {
      screening: Number(((stageCount('screening') / applied) * 100).toFixed(2)),
      interview: Number(((stageCount('interview') / applied) * 100).toFixed(2)),
      offer: Number(((stageCount('offer') / applied) * 100).toFixed(2)),
      hired: Number(((stageCount('hired') / applied) * 100).toFixed(2)),
    },
  });
});

router.get('/audit-logs', requireRole(['hr']), (_req, res) => {
  return res.json([...db.recruitmentAudits.values()]);
});

export default router;
