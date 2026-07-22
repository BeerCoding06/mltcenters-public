function sendError(res, err) {
  const message = err?.message || 'Internal error';
  if (message === 'Profile not found' || message === 'Word not found' || message === 'Session not found') {
    return res.status(404).json({ error: message });
  }
  if (message === 'No known words available for sentences') {
    return res.status(400).json({ error: message });
  }
  console.error('[vocab]', err);
  return res.status(500).json({ error: message });
}

export function createVocabController({ service }) {
  async function postProfile(req, res) {
    try {
      const { goal, levelId } = req.body || {};
      const profile = await service.ensureProfile(req.visitorId, { goal, levelId });
      const dashboard = await service.getDashboard(profile.id);
      return res.json(dashboard);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function getDashboard(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const dashboard = await service.getDashboard(profile.id);
      return res.json(dashboard);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function getLevels(_req, res) {
    try {
      const levels = await service.listLevels();
      return res.json({ levels });
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function getWord(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const word = await service.getWordDetail(profile.id, req.params.id);
      return res.json(word);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function postSession(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const { mode } = req.body || {};
      if (!['learn', 'review', 'quiz'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
      }
      const session = await service.startSession(profile.id, mode);
      return res.json(session);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function postSessionAnswer(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const result = await service.submitAnswer(profile.id, req.params.id, req.body || {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function postSessionComplete(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const session = await service.completeSession(profile.id, req.params.id);
      return res.json({ ok: true, session });
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function getReviewQueue(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const queue = await service.getReviewQueue(profile.id);
      return res.json({ queue });
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function getRecommendToday(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const pack = await service.getRecommendToday(profile.id);
      return res.json(pack);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async function postAiSentences(req, res) {
    try {
      const profile = await service.ensureProfile(req.visitorId);
      const result = await service.getOrCreateDailySentences(profile.id);
      return res.json(result);
    } catch (err) {
      return sendError(res, err);
    }
  }

  return {
    postProfile,
    getDashboard,
    getLevels,
    getWord,
    postSession,
    postSessionAnswer,
    postSessionComplete,
    getReviewQueue,
    getRecommendToday,
    postAiSentences,
  };
}
