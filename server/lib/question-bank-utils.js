/** Shuffle MCQ options while keeping correct_index accurate (handles duplicate option text). */

export function shuffleQuestionOptions(item) {
  const indices = item.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const options = indices.map((i) => item.options[i]);
  const correct_index = indices.indexOf(item.correct_index);
  return { ...item, options, correct_index };
}

export function validateQuestion(item, { throwOnError = true } = {}) {
  const errors = [];
  if (!item.question?.trim()) errors.push('missing question text');
  if (!Array.isArray(item.options) || item.options.length !== 3) {
    errors.push('must have exactly 3 options');
  }
  const correct = item.options?.[item.correct_index];
  if (correct === undefined) {
    errors.push(`correct_index ${item.correct_index} out of range`);
  }
  const unique = new Set(item.options || []);
  if (unique.size !== item.options?.length) {
    errors.push(`duplicate options: ${JSON.stringify(item.options)}`);
  }
  if (errors.length && throwOnError) {
    throw new Error(`${item.question}: ${errors.join('; ')}`);
  }
  return errors;
}

export function validateBank(bank) {
  const issues = [];
  const seen = new Set();
  for (const item of bank) {
    const errs = validateQuestion(item, { throwOnError: false });
    if (errs.length) issues.push({ question: item.question, errors: errs });
    if (seen.has(item.question)) issues.push({ question: item.question, errors: ['duplicate question'] });
    seen.add(item.question);
  }
  return issues;
}
