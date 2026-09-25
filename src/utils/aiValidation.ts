/**
 * Detects if the provided prompt is empty, generic instructions for the AI, UI labels,
 * or meta-text instead of an actual affiliate/partner task description.
 */
export function isInstructionOrMetaText(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();

  // Known instruction and meta phrases
  const metaPhrases = [
    'the partner/admin should describe',
    'the partner should describe',
    'the admin should describe',
    'ai must understand',
    'ai must',
    'ai should',
    'instructions for the ai',
    'instruction for the ai',
    'these are instructions',
    'these are instructions for the ai',
    'do not support multiple tasks',
    'do not create separate drafts',
    'natural language description',
    'system instruction',
    'system prompt',
    'prompt template',
    'you are the ai task structurer',
    'convert them into structured',
    'return only a valid json',
    'example of wrong behavior',
    'rule 1',
    'rule 2',
    'rule 3',
    'rule 4',
    'rule 5',
    'rule 6',
    'rule 7',
    'rule 8',
    'rule 9',
    'rule 10',
    'rule 11',
    'rule 12',
    'rule 13',
    'please describe the actual task',
    'validation rules',
    'ai rules',
    'task draft per generate action',
    'field names inside one task',
    'generated task drafts count',
    'one task only',
    'financial task safety'
  ];

  for (const phrase of metaPhrases) {
    if (lower.includes(phrase)) {
      return true;
    }
  }

  // Field names or labels alone without substantive task details
  const fieldKeywords = [
    'task title',
    'task description',
    'reward',
    'eligibility',
    'instructions',
    'proof',
    'ai rules',
    'validation rules',
    'destination url',
    'valid dates',
    'category'
  ];

  const strippedPunctuation = lower.replace(/[:\-\*#_•]/g, ' ').replace(/\s+/g, ' ').trim();
  if (fieldKeywords.includes(strippedPunctuation)) {
    return true;
  }

  // If text is composed purely of field labels with no substantive task actions
  const lines = trimmed
    .split(/\n+/)
    .map(l => l.replace(/^[0-9\.\-\*#_•:\s]+/, '').trim().toLowerCase())
    .filter(Boolean);

  if (lines.length > 0 && lines.every(l => fieldKeywords.some(fk => l === fk || l.startsWith(fk + ':') || l.startsWith(fk + ' -')))) {
    const hasSubstance = lines.some(l => {
      const match = fieldKeywords.find(fk => l.startsWith(fk));
      if (!match) return true;
      const rest = l.substring(match.length).replace(/[:\-\s]/g, '').trim();
      return rest.length > 15;
    });
    if (!hasSubstance) {
      return true;
    }
  }

  return false;
}
