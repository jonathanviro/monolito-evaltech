const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Admin
  getStats: () => request('/admin/stats'),
  getCandidates: () => request('/candidates'),
  getCandidate: (id: string) => request(`/candidates/${id}`),
  createCandidate: (name: string, email: string) =>
    request('/candidates', { method: 'POST', body: JSON.stringify({ name, email }) }),
  scoreOpenQuestion: (candidateId: string, answerId: string, isCorrect: boolean) =>
    request(`/candidates/${candidateId}/score-open`, {
      method: 'PATCH',
      body: JSON.stringify({ answerId, isCorrect: String(isCorrect) }),
    }),

  // Evaluation
  getEvaluation: (token: string) => request(`/evaluation/${token}`),
  startEvaluation: (token: string) =>
    request(`/evaluation/${token}/start`, { method: 'POST' }),
  submitAnswer: (token: string, questionId: string, selectedAnswer?: string, textAnswer?: string) =>
    request(`/evaluation/${token}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAnswer, textAnswer }),
    }),
  reportFocusLoss: (token: string, lostAt: string, returnedAt: string, durationMs: number) =>
    request(`/evaluation/${token}/focus-loss`, {
      method: 'POST',
      body: JSON.stringify({ lostAt, returnedAt, durationMs }),
    }),
  submitEvaluation: (token: string) =>
    request(`/evaluation/${token}/submit`, { method: 'PATCH' }),
};
