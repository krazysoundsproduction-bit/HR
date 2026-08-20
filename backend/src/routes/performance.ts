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
const getSearchParam = (url: string, key: string) => {
  const value = new URL(url, 'http://localhost').searchParams.get(key);
  return value ?? undefined;
};

const cycleSchema = z.object({
  name: z.string().min(1),
  year: z.number().int(),
  quarter: z.number().int().min(1).max(4),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  createdBy: z.string().min(1).default('hr'),
});

const reviewSchema = z.object({
  cycleId: z.string().min(1),
  employeeId: z.string().min(1),
  reviewerId: z.string().min(1),
  type: z.enum(['self', 'manager', 'peer', '360']),
});

const reviewUpdateSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'submitted', 'acknowledged']).optional(),
  overallRating: ratingSchema.optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  comments: z.string().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required',
});

const goalSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  targetDate: z.string().min(1),
  status: z.enum(['active', 'completed', 'missed', 'cancelled']).default('active'),
  progress: z.number().min(0).max(100).default(0),
  category: z.string().min(1),
  createdBy: z.string().min(1),
});

const goalUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  targetDate: z.string().min(1).optional(),
  status: z.enum(['active', 'completed', 'missed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  category: z.string().min(1).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required',
});

const feedbackSchema = z.object({
  fromEmployeeId: z.string().min(1),
  toEmployeeId: z.string().min(1),
  type: z.enum(['praise', 'constructive', 'general']),
  content: z.string().min(1),
  visibility: z.enum(['private', 'public']),
});

const developmentPlanSchema = z.object({
  employeeId: z.string().min(1),
  reviewId: z.string().min(1),
  skills: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  targetDate: z.string().min(1),
  status: z.enum(['active', 'completed']).default('active'),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const paginate = <T,>(items: T[], url: string) => {
  const { limit, offset } = paginationSchema.parse({
    limit: getSearchParam(url, 'limit'),
    offset: getSearchParam(url, 'offset'),
  });
  return {
    total: items.length,
    limit,
    offset,
    items: items.slice(offset, offset + limit),
  };
};

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('perf_audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.performanceAudits.set(event.id, event);
  db.auditLogs.set(event.id, event);
};

router.post('/cycles', requireRole(['hr']), (req, res) => {
  const parsed = cycleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const cycle = {
    id: id('cycle'),
    ...parsed.data,
    status: 'planning' as const,
  };
  db.reviewCycles.set(cycle.id, cycle);
  audit('review_cycle', cycle.id, 'create', req.header('x-employee-id') || cycle.createdBy, cycle);
  return res.status(201).json(cycle);
});

router.get('/cycles', requireRole(['hr', 'manager']), (req, res) => {
  const yearValue = getSearchParam(req.originalUrl, 'year');
  const year = yearValue ? Number(yearValue) : undefined;
  const cycles = [...db.reviewCycles.values()].filter((cycle) => !year || cycle.year === year);
  return res.json(paginate(cycles.sort((a, b) => b.year - a.year || b.quarter - a.quarter), req.originalUrl));
});

router.patch('/cycles/:id/activate', requireRole(['hr']), (req, res) => {
  const cycle = db.reviewCycles.get(String(req.params.id));
  if (!cycle) {
    return res.status(404).json({ error: 'Review cycle not found' });
  }
  const updated = { ...cycle, status: 'active' as const };
  db.reviewCycles.set(updated.id, updated);
  audit('review_cycle', updated.id, 'activate', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.patch('/cycles/:id/complete', requireRole(['hr']), (req, res) => {
  const cycle = db.reviewCycles.get(String(req.params.id));
  if (!cycle) {
    return res.status(404).json({ error: 'Review cycle not found' });
  }
  const updated = { ...cycle, status: 'completed' as const };
  db.reviewCycles.set(updated.id, updated);
  audit('review_cycle', updated.id, 'complete', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.post('/reviews', requireRole(['hr', 'manager']), (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  if (!db.reviewCycles.has(parsed.data.cycleId)) {
    return res.status(404).json({ error: 'Review cycle not found' });
  }
  const review = {
    id: id('review'),
    ...parsed.data,
    status: 'pending' as const,
  };
  db.performanceReviews.set(review.id, review);
  audit('performance_review', review.id, 'create', req.header('x-employee-id') || parsed.data.reviewerId, review);
  return res.status(201).json(review);
});

router.get('/reviews', requireRole(['hr', 'manager']), (req, res) => {
  const cycleId = getSearchParam(req.originalUrl, 'cycleId');
  const employeeId = getSearchParam(req.originalUrl, 'employeeId');
  const reviews = [...db.performanceReviews.values()].filter((review) => {
    if (cycleId && review.cycleId !== cycleId) return false;
    if (employeeId && review.employeeId !== employeeId) return false;
    return true;
  });
  return res.json(paginate(reviews, req.originalUrl));
});

router.get('/reviews/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const review = db.performanceReviews.get(String(req.params.id));
  if (!review) {
    return res.status(404).json({ error: 'Performance review not found' });
  }
  return res.json(review);
});

router.patch('/reviews/:id', requireRole(['hr', 'manager']), (req, res) => {
  const review = db.performanceReviews.get(String(req.params.id));
  if (!review) {
    return res.status(404).json({ error: 'Performance review not found' });
  }
  const parsed = reviewUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...review, ...parsed.data };
  db.performanceReviews.set(updated.id, updated);
  audit('performance_review', updated.id, 'update', req.header('x-employee-id') || 'manager', updated);
  return res.json(updated);
});

router.post('/reviews/:id/submit', requireRole(['hr', 'manager']), (req, res) => {
  const review = db.performanceReviews.get(String(req.params.id));
  if (!review) {
    return res.status(404).json({ error: 'Performance review not found' });
  }
  const updated = {
    ...review,
    status: 'submitted' as const,
    submittedAt: nowIso(),
  };
  db.performanceReviews.set(updated.id, updated);
  audit('performance_review', updated.id, 'submit', req.header('x-employee-id') || review.reviewerId, updated);
  return res.json(updated);
});

router.post('/reviews/:id/acknowledge', requireRole(['employee', 'manager']), (req, res) => {
  const review = db.performanceReviews.get(String(req.params.id));
  if (!review) {
    return res.status(404).json({ error: 'Performance review not found' });
  }
  const updated = {
    ...review,
    status: 'acknowledged' as const,
    acknowledgedAt: nowIso(),
  };
  db.performanceReviews.set(updated.id, updated);
  audit('performance_review', updated.id, 'acknowledge', req.header('x-employee-id') || review.employeeId, updated);
  return res.json(updated);
});

router.post('/goals', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const goal = {
    id: id('goal'),
    ...parsed.data,
  };
  db.goals.set(goal.id, goal);
  audit('goal', goal.id, 'create', req.header('x-employee-id') || goal.createdBy, goal);
  return res.status(201).json(goal);
});

router.get('/goals/:employeeId', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const goals = [...db.goals.values()].filter((goal) => goal.employeeId === String(req.params.employeeId));
  return res.json(paginate(goals.sort((a, b) => a.targetDate.localeCompare(b.targetDate)), req.originalUrl));
});

router.patch('/goals/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const goal = db.goals.get(String(req.params.id));
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  const parsed = goalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...goal, ...parsed.data };
  db.goals.set(updated.id, updated);
  audit('goal', updated.id, 'update', req.header('x-employee-id') || goal.employeeId, updated);
  return res.json(updated);
});

router.post('/feedback', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const feedback = {
    id: id('feedback'),
    ...parsed.data,
    createdAt: nowIso(),
  };
  db.feedbackEntries.set(feedback.id, feedback);
  audit('feedback', feedback.id, 'create', req.header('x-employee-id') || feedback.fromEmployeeId, feedback);
  return res.status(201).json(feedback);
});

router.get('/feedback/:employeeId', requireRole(['hr', 'manager']), (req, res) => {
  const feedback = [...db.feedbackEntries.values()].filter((item) => item.toEmployeeId === String(req.params.employeeId));
  return res.json(paginate(feedback.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), req.originalUrl));
});

router.post('/development-plans', requireRole(['hr', 'manager']), (req, res) => {
  const parsed = developmentPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  if (!db.performanceReviews.has(parsed.data.reviewId)) {
    return res.status(404).json({ error: 'Performance review not found' });
  }
  const plan = {
    id: id('dev_plan'),
    ...parsed.data,
  };
  db.developmentPlans.set(plan.id, plan);
  audit('development_plan', plan.id, 'create', req.header('x-employee-id') || 'manager', plan);
  return res.status(201).json(plan);
});

router.get('/development-plans/:employeeId', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const plans = [...db.developmentPlans.values()].filter((plan) => plan.employeeId === String(req.params.employeeId));
  return res.json(paginate(plans.sort((a, b) => a.targetDate.localeCompare(b.targetDate)), req.originalUrl));
});

router.get('/summary/:employeeId', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const employeeId = String(req.params.employeeId);
  const reviews = [...db.performanceReviews.values()].filter((review) => review.employeeId === employeeId);
  const goals = [...db.goals.values()].filter((goal) => goal.employeeId === employeeId);
  const feedback = [...db.feedbackEntries.values()].filter((item) => item.toEmployeeId === employeeId);
  const plans = [...db.developmentPlans.values()].filter((plan) => plan.employeeId === employeeId);
  const ratedReviews = reviews.filter((review) => typeof review.overallRating === 'number');
  const averageRating = ratedReviews.length
    ? Number((ratedReviews.reduce((sum, review) => sum + Number(review.overallRating), 0) / ratedReviews.length).toFixed(2))
    : null;
  return res.json({
    employeeId,
    reviews: {
      total: reviews.length,
      submitted: reviews.filter((review) => review.status === 'submitted' || review.status === 'acknowledged').length,
      averageRating,
    },
    goals: {
      total: goals.length,
      active: goals.filter((goal) => goal.status === 'active').length,
      completed: goals.filter((goal) => goal.status === 'completed').length,
      averageProgress: goals.length
        ? Number((goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length).toFixed(2))
        : 0,
    },
    feedback: {
      total: feedback.length,
      public: feedback.filter((item) => item.visibility === 'public').length,
      private: feedback.filter((item) => item.visibility === 'private').length,
    },
    developmentPlans: plans,
  });
});

router.get('/audit-logs', requireRole(['hr']), (_req, res) => {
  return res.json([...db.performanceAudits.values()]);
});

export default router;
