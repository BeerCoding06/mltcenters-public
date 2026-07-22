import { Router } from 'express';
import { createVocabController } from './controller.js';

function requireVisitorId(req, res, next) {
  const visitorId = req.get('X-Visitor-Id')?.trim();
  if (!visitorId) {
    return res.status(400).json({ error: 'Missing X-Visitor-Id header' });
  }
  req.visitorId = visitorId;
  return next();
}

export function createVocabRouter({ service }) {
  const router = Router();
  const controller = createVocabController({ service });

  router.use(requireVisitorId);

  router.post('/profile', controller.postProfile);
  router.get('/dashboard', controller.getDashboard);
  router.get('/levels', controller.getLevels);
  router.get('/words/:id', controller.getWord);
  router.post('/sessions', controller.postSession);
  router.post('/sessions/:id/answer', controller.postSessionAnswer);
  router.post('/sessions/:id/complete', controller.postSessionComplete);
  router.get('/review/queue', controller.getReviewQueue);
  router.get('/recommend/today', controller.getRecommendToday);
  router.post('/ai/sentences', controller.postAiSentences);

  return router;
}

export default createVocabRouter;
