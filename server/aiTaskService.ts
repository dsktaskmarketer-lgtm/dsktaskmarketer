import { GoogleGenAI } from '@google/genai';
import type { Task } from '../src/types';

export interface AIDraftTaskResult {
  id: string;
  tempId: string;
  title: string;
  company: string;
  productService: string;
  description: string;
  userAction: string;
  instructions: string[];
  rewardAmount: number;
  proofRequirements: string[];
  destinationUrl: string;
  validDates: string;
  participantLimit: number | null;
  terms: string;
  categorySlug: string;
  categoryId: string;
  missingInfo: string[];
  isReviewRequired: boolean;
  isDuplicate?: boolean;
  duplicateWarning?: string;
  status: 'draft' | 'review_required' | 'ready';
  rawInputSnippet?: string;
}

export interface AITaskGenerationResponse {
  success: boolean;
  tasks: AIDraftTaskResult[];
  error?: string;
  rawInput: string;
  canManualCreate: boolean;
  stats?: {
    totalDetected: number;
    successful: number;
    failed: number;
  };
}

export interface CampaignEnquiryExtracted {
  partnerType: string;
  businessName: string;
  contactPerson: string;
  productService: string;
  desiredResult: string;
  promotionRequirement: string;
  targetAudience: string;
  targetLocation: string;
  expectedVolume: string;
  budget: string | number;
  duration: string;
  specificConditions: string;
  trackingUrl: string;
  trackingUrlArrangedByAdmin: boolean;
  creatorPlatforms?: string[];
  socialMediaProfiles?: string;
  website?: string;
  businessLocation?: string;
  officialEmail: string;
  phoneNumber: string;
  whatsappNumber: string;
  missingFields: string[];
  aiSummary: string;
  nextQuestion?: string;

  // Backward-compatibility aliases
  advertiserName?: string;
  companyName?: string;
  contactEmail?: string;
  contactMobile?: string;
  objective?: string;
  rewardPerAction?: number;
  requiredProof?: string[];
  timelines?: string;
  affiliateUrl?: string;
  notes?: string;
}

// Category mappings to existing database IDs
export const CATEGORY_MAP: Record<string, string> = {
  'credit-cards': 'cat_cards',
  'banking': 'cat_banking',
  'demat-investment': 'cat_demat',
  'financial': 'cat_demat',
  'loans': 'cat_loans',
  'insurance': 'cat_insurance',
  'financial-apps': 'cat_apps',
  'app-website': 'cat_apps',
  'shopping': 'cat_shopping',
  'local-business': 'cat_local',
  'social-media': 'cat_social',
  'education': 'cat_education',
  'services': 'cat_services',
  'other-affiliates': 'cat_other',
  'other': 'cat_other'
};

export const CATEGORY_SLUGS = [
  'banking',
  'credit-cards',
  'demat-investment',
  'loans',
  'insurance',
  'financial-apps',
  'shopping',
  'local-business',
  'social-media',
  'education',
  'services',
  'other-affiliates'
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a Gemini content generation with automated fallback across compatible models.
 * Prioritizes high-availability, low-latency 'gemini-3.1-flash-lite' first, then falls back to 'gemini-3.8-flash' and 'gemini-flash-latest'.
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  }
): Promise<{ text: string; modelUsed: string }> {
  // Ordered by current availability and speed
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastErrorMessage = '';

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      const text = response.text || '';
      if (text) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      lastErrorMessage = rawMsg;
      const errMsg = rawMsg.toLowerCase();
      const isTransient = 
        errMsg.includes('503') || 
        errMsg.includes('high demand') || 
        errMsg.includes('unavailable') || 
        errMsg.includes('429') || 
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('econnreset') ||
        errMsg.includes('timeout');

      if (isTransient && i < candidateModels.length - 1) {
        console.log(`[AI Tasks] Model ${model} is experiencing high demand. Seamlessly switching to ${candidateModels[i + 1]}...`);
        continue;
      }
      break;
    }
  }

  throw new Error(lastErrorMessage ? 'AI service temporarily unavailable due to demand spikes.' : 'All AI models are currently unavailable.');
}

/**
 * Normalizes strings for loose similarity check
 */
function cleanForComparison(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a generated task is likely a duplicate of an existing task
 */
function checkForDuplicates(
  draft: { title: string; company: string },
  existingTasks: Task[],
  otherDrafts: Array<{ title: string; company: string }>
): { isDuplicate: boolean; warning?: string } {
  const draftTitleClean = cleanForComparison(draft.title);
  const draftCompanyClean = cleanForComparison(draft.company);

  // Check against existing system tasks
  for (const t of existingTasks) {
    const tTitleClean = cleanForComparison(t.title);
    const tPartnerClean = cleanForComparison(t.partnerName || '');

    if (tTitleClean && draftTitleClean && (tTitleClean.includes(draftTitleClean) || draftTitleClean.includes(tTitleClean))) {
      return {
        isDuplicate: true,
        warning: `Possible duplicate: Matches existing task "${t.title}" (${t.partnerName})`
      };
    }

    if (tPartnerClean && draftCompanyClean && tPartnerClean === draftCompanyClean) {
      if (draftTitleClean.length > 5 && tTitleClean.length > 5) {
        // Both mention same company and have overlapping words
        return {
          isDuplicate: true,
          warning: `Note: Company "${t.partnerName}" already has an active task: "${t.title}"`
        };
      }
    }
  }

  // Check against other drafts in the same batch
  let countInBatch = 0;
  for (const od of otherDrafts) {
    if (cleanForComparison(od.title) === draftTitleClean && cleanForComparison(od.company) === draftCompanyClean) {
      countInBatch++;
    }
  }
  if (countInBatch > 1) {
    return {
      isDuplicate: true,
      warning: `Repeated draft detected in this batch.`
    };
  }

  return { isDuplicate: false };
}

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
    'please describe the actual task',
    'validation rules',
    'ai rules',
    'task draft per generate action',
    'field names inside one task',
    'generated task drafts count'
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

/**
 * Generates EXACTLY ONE structured draft task from natural language input.
 * Strictly enforces:
 * - Only 1 task draft per generate action.
 * - If input contains multiple steps, combine all steps into ONE task.
 * - Never treat AI instructions or UI labels as task content.
 * - Handles English, Tamil, Tanglish (Tamil in English script), and mixed languages.
 */
export async function generateStructuredTasks(
  rawInput: string,
  existingTasks: Task[] = []
): Promise<AITaskGenerationResponse> {
  const inputTrimmed = (rawInput || '').trim();

  // RULE 4: If empty or contains only instructions/meta text, show required error
  if (!inputTrimmed || isInstructionOrMetaText(inputTrimmed)) {
    return {
      success: false,
      tasks: [],
      error: 'Please describe the actual task you want to create.',
      rawInput: inputTrimmed,
      canManualCreate: false
    };
  }

  const ai = getGeminiClient();

  // If Gemini API is not configured, gracefully provide fallback structured draft
  if (!ai) {
    console.warn('[AI Tasks] GEMINI_API_KEY not configured. Falling back to single-task heuristic parsing.');
    return fallbackHeuristicParse(inputTrimmed, existingTasks);
  }

  try {
    const systemInstruction = `
You are the AI Task Structurer for DSK TaskMarketer (an Indian affiliate & rewards marketing platform).
Your responsibility is to take the administrator's natural language task description and convert it into EXACTLY ONE single structured task to automatically fill the existing "Create New Financial Task" form.

WORKFLOW & FORM FIELD MAPPING:
1. Read ONLY the actual task description entered by the Admin. Never treat AI instructions, guidelines, or meta-labels as task content.
2. Understand what type of task it is.
3. Automatically identify the appropriate category:
   Examples of categories:
   - "banking" (Banking Accounts, Savings accounts, zero-balance, deposits)
   - "credit-cards" (Credit Cards, Card applications)
   - "demat-investment" (Financial, Demat, Trading, Mutual Funds, Wealth)
   - "loans" (Personal Loans, Instant credit lines)
   - "insurance" (Health, Life, Vehicle insurance)
   - "financial-apps" (Fintech Apps, UPI, Wallet, Credit score monitors)
   - "app-website" (App download, Website signup)
   - "shopping" (E-commerce, Retail purchase)
   - "local-business" (Local shops, Supermarkets, In-store)
   - "social-media" (Telegram, YouTube, Instagram)
   - "education" (Courses, Learning)
   - "services" (Utility, Professional services)
   - "other-affiliates" (Other partner offers)
4. Extract all available information from the prompt:
   - Task Title: Generate a clear, concise, professional title from the user's description (e.g. "Kotak 811 Savings Account", "Navi App - KYC & Mutual Fund").
   - Partner / Bank Name: Extract the company, brand, bank, business, or partner name if provided (e.g. "Kotak Mahindra Bank", "Navi").
   - Reward Amount: Extract the reward/payout if provided in prompt (e.g. 250). If NOT provided, set to null. DO NOT guess or invent fake numbers like ₹50!
   - Affiliate Destination URL: Extract the affiliate/tracking/application URL if provided in prompt. If NOT provided, set to "". DO NOT invent fake URLs like "https://dsktaskmarketer.com"!
   - Description: Generate a clear user-friendly description from the original prompt.
   - Eligibility Criteria: Extract eligibility requirements if provided in prompt. If NOT provided, set to "". DO NOT guess fake eligibility like "Age 18+ Indian Resident..."!
   - Required Steps: Convert the instructions from the prompt into clear numbered steps in the "instructions" array.
   - Proof Requirements: Identify appropriate safe proof required to verify completion (e.g. "Account opening confirmation screenshot", "Order / Bill receipt").
   - Specific Terms: Extract important conditions, restrictions and payment conditions.

5. CRITICAL - FINANCIAL TASK SAFETY:
   For financial tasks, NEVER request users to submit:
   PAN number
   Aadhaar number
   OTP
   PIN
   CVV
   Password
   Banking credentials
   as task proof!
   Sensitive information must only be entered on the official financial institution's secure website/app. Proof must only consist of safe confirmation receipts, screenshots, or reference numbers.

6. MISSING INFORMATION:
   If an important field is NOT provided in the prompt, DO NOT invent or guess it.
   Ask the Admin ONLY for the missing information:
   - If Reward is not provided:
     Add to missingQuestions: "What reward amount should be given for this task?"
     Add to missingFields: ["rewardAmount"]
   - If Affiliate Destination URL is not provided:
     Add to missingQuestions: "Please provide the official affiliate/application URL."
     Add to missingFields: ["destinationUrl"]
   - If Eligibility is missing and necessary:
     Add to missingQuestions: "What are the eligibility criteria for this task?"
     Add to missingFields: ["eligibility"]
   DO NOT ask for information that is already provided or can be extracted from the prompt!

7. ONE TASK ONLY:
   One user prompt = exactly ONE task. Never create multiple drafts, subtasks or separate tasks from individual fields.

Return ONLY a valid JSON object matching this schema:
{
  "task": {
    "title": "string (clear title)",
    "company": "string (bank/brand name if provided, or empty)",
    "productService": "string (product name)",
    "categorySlug": "banking" | "credit-cards" | "demat-investment" | "loans" | "insurance" | "financial-apps" | "app-website" | "shopping" | "local-business" | "social-media" | "education" | "services" | "other-affiliates",
    "description": "string (clear user-friendly description)",
    "rewardAmount": number | null,
    "destinationUrl": "string (URL if in prompt, or empty string)",
    "eligibility": "string (eligibility if in prompt, or empty string)",
    "instructions": ["string (step 1)", "string (step 2)"],
    "proofRequirements": ["string (safe proof 1)", "string (safe proof 2)"],
    "terms": "string (terms and conditions)",
    "missingFields": ["string"],
    "missingQuestions": ["string"]
  }
}
`;

    const { text: responseText, modelUsed } = await callGeminiWithFallback(ai, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please convert the following task description into EXACTLY ONE structured draft task to populate the Create New Financial Task form:\n\n"""\n${inputTrimmed}\n"""`
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[AI Tasks] Failed to parse JSON from Gemini (using heuristic fallback):', responseText);
      const fallbackResponse = fallbackHeuristicParse(inputTrimmed, existingTasks);
      return {
        ...fallbackResponse,
        error: 'AI returned an unformatted response. We extracted your task using our backup parser.',
        canManualCreate: true
      };
    }

    // Extract the single task object (either from parsed.task, parsed.tasks[0], or parsed)
    let item: any = parsed?.task;
    if (!item && Array.isArray(parsed?.tasks) && parsed.tasks.length > 0) {
      item = parsed.tasks[0];
    } else if (!item && Array.isArray(parsed) && parsed.length > 0) {
      item = parsed[0];
    } else if (!item && typeof parsed === 'object') {
      item = parsed;
    }

    if (!item || !item.title) {
      return fallbackHeuristicParse(inputTrimmed, existingTasks);
    }

    const tempId = `ai_draft_${Date.now()}_1`;
    const title = String(item.title || 'Affiliate Partner Task').trim();
    const company = String(item.company || '').trim();
    const catSlug = String(item.categorySlug || 'other-affiliates').toLowerCase();
    const catId = CATEGORY_MAP[catSlug] || 'cat_other';

    const missingFields: string[] = Array.isArray(item.missingFields) ? item.missingFields : [];
    const missingQuestions: string[] = Array.isArray(item.missingQuestions) ? item.missingQuestions : [];
    
    // Reward amount extraction: check if provided or missing
    let reward: number = 0;
    if (item.rewardAmount !== null && item.rewardAmount !== undefined && Number(item.rewardAmount) > 0) {
      reward = Number(item.rewardAmount);
    } else {
      if (!missingFields.includes('rewardAmount')) {
        missingFields.push('rewardAmount');
      }
      if (!missingQuestions.some(q => q.toLowerCase().includes('reward'))) {
        missingQuestions.push('What reward amount should be given for this task?');
      }
    }

    // URL extraction: check if provided or missing
    let url = (item.destinationUrl && item.destinationUrl !== 'Information Required' && item.destinationUrl.startsWith('http'))
      ? String(item.destinationUrl).trim()
      : '';
    if (!url) {
      if (!missingFields.includes('destinationUrl')) {
        missingFields.push('destinationUrl');
      }
      if (!missingQuestions.some(q => q.toLowerCase().includes('url') || q.toLowerCase().includes('link'))) {
        missingQuestions.push('Please provide the official affiliate/application URL.');
      }
    }

    // Eligibility extraction:
    const eligibility = (item.eligibility && item.eligibility !== 'Information Required')
      ? String(item.eligibility).trim()
      : '';

    // Filter sensitive items from proof requirements (Safety Rule)
    const sanitizeProof = (proofList: any[]): string[] => {
      const sensitiveKeywords = ['pan', 'aadhaar', 'aadhar', 'otp', 'pin', 'cvv', 'password', 'credential', 'net banking'];
      const safe = (proofList || [])
        .map(String)
        .filter(p => {
          const lowerP = p.toLowerCase();
          return !sensitiveKeywords.some(k => lowerP.includes(k));
        });
      if (safe.length === 0) {
        return ['Confirmation screenshot / Reference ID'];
      }
      return safe;
    };

    let proofRequirements = sanitizeProof(item.proofRequirements);
    let instructions: string[] = Array.isArray(item.instructions) && item.instructions.length > 0
      ? item.instructions.map(String)
      : [
          'Click the official link to access the offer.',
          'Complete the required process as instructed.',
          'Submit the safe confirmation proof.'
        ];

    const missingInfo: string[] = [];
    if (!reward || reward <= 0) {
      missingInfo.push('Reward Amount: Information Required');
    }
    if (!url) {
      missingInfo.push('Affiliate Destination URL: Information Required');
    }
    if (!eligibility) {
      missingInfo.push('Eligibility Criteria: Information Required');
    }

    const isReview = missingFields.length > 0;

    const duplicateCheck = checkForDuplicates(
      { title, company: company || title },
      existingTasks,
      []
    );

    const draft: AIDraftTaskResult & { eligibility?: string; missingFields?: string[]; missingQuestions?: string[] } = {
      id: tempId,
      tempId,
      title,
      company: company || 'Partner Offer',
      productService: String(item.productService || company || 'Partner Service').trim(),
      description: String(item.description || inputTrimmed).trim(),
      userAction: String(item.userAction || 'Complete required process and submit safe proof').trim(),
      instructions,
      rewardAmount: reward,
      proofRequirements,
      destinationUrl: url || 'Information Required',
      validDates: 'Information Required',
      participantLimit: null,
      terms: String(item.terms || 'Verified reward payable upon compliance approval and partner audit confirmation.').trim(),
      categorySlug: catSlug,
      categoryId: catId,
      eligibility,
      missingInfo,
      missingFields,
      missingQuestions,
      isReviewRequired: isReview,
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateWarning: duplicateCheck.warning,
      status: isReview ? 'review_required' : 'ready',
      rawInputSnippet: inputTrimmed
    };

    return {
      success: true,
      tasks: [draft], // STRICTLY ONE TASK
      rawInput: inputTrimmed,
      canManualCreate: true,
      stats: {
        totalDetected: 1,
        successful: isReview ? 0 : 1,
        failed: isReview ? 1 : 0
      }
    };
  } catch (err: any) {
    console.log('[AI Tasks] Notice: Switching to offline single-task heuristic fallback parser.');
    const fallbackResponse = fallbackHeuristicParse(inputTrimmed, existingTasks);
    return {
      ...fallbackResponse,
      error: `The AI model is currently experiencing temporary high demand (503 Service Unavailable). We've generated your single structured draft task using our offline parser so you can proceed without interruption.`,
      canManualCreate: true
    };
  }
}

/**
 * Fallback parser when Gemini API key is not yet set or during offline fallback.
 * Generates EXACTLY ONE structured task draft from the user input.
 * Never creates multiple tasks or separate drafts for steps/fields.
 */
function fallbackHeuristicParse(
  input: string,
  existingTasks: Task[]
): AITaskGenerationResponse {
  const cleanInput = (input || '').trim();

  // Attempt to extract reward
  const rewardMatch = cleanInput.match(/(?:₹|rs\.?|inr)\s*(\d+)/i) || cleanInput.match(/(\d+)\s*(?:rs|reward|rooba|rupees|cashback)/i);
  const rewardAmount = rewardMatch ? Number(rewardMatch[1]) : 0;

  // Attempt to extract URL
  const urlMatch = cleanInput.match(/https?:\/\/[^\s]+/i);
  const destinationUrl = urlMatch ? urlMatch[0] : 'Information Required';

  const lower = cleanInput.toLowerCase();

  let company = 'Partner Offer';
  let categorySlug = 'other-affiliates';
  let productService = 'Affiliate Promotion';
  let userAction = 'Complete required process and submit safe proof';
  let proofRequirements = ['Reference ID / Confirmation number', 'Confirmation screenshot'];

  // Identify partner and category accurately without defaulting to merchant purchase
  if (lower.includes('kotak') || lower.includes('811')) {
    company = 'Kotak Mahindra Bank';
    categorySlug = 'banking';
    productService = 'Digital Savings Account';
    userAction = 'Digital bank account opening and KYC verification';
    proofRequirements = ['Account CRN / Reference Number', 'Account opening confirmation screenshot'];
  } else if (lower.includes('hdfc')) {
    company = 'HDFC Bank';
    categorySlug = lower.includes('card') ? 'credit-cards' : 'banking';
    productService = lower.includes('card') ? 'Credit Card' : 'Savings Account';
    userAction = lower.includes('card') ? 'Credit card application submission' : 'Digital account opening and KYC';
    proofRequirements = ['Application Reference ID', 'Application confirmation screenshot'];
  } else if (lower.includes('sbi')) {
    company = 'SBI Card';
    categorySlug = 'credit-cards';
    productService = 'Credit Card';
    userAction = 'Credit card application and digital e-KYC';
    proofRequirements = ['Application Number', 'Acknowledgment screen screenshot'];
  } else if (lower.includes('navi')) {
    company = 'Navi';
    categorySlug = 'financial-apps';
    productService = 'Mutual Funds & Digital Finance';
    userAction = 'App download, KYC verification, and initial investment';
    proofRequirements = ['Registered mobile / Account ID', 'Investment confirmation screenshot'];
  } else if (lower.includes('angel one') || lower.includes('angelone')) {
    company = 'Angel One';
    categorySlug = 'demat-investment';
    productService = 'Demat & Trading Account';
    userAction = 'Demat account opening and trade execution';
    proofRequirements = ['Angel One Client ID', 'Welcome email / confirmation screenshot'];
  } else if (lower.includes('zerodha')) {
    company = 'Zerodha';
    categorySlug = 'demat-investment';
    productService = 'Demat & Trading Account';
    userAction = 'Online Demat account opening and e-Sign';
    proofRequirements = ['Zerodha Client ID', 'e-Sign confirmation screenshot'];
  } else if (lower.includes('groww')) {
    company = 'Groww';
    categorySlug = 'demat-investment';
    productService = 'Investment Account';
    userAction = 'Account registration and KYC completion';
    proofRequirements = ['Account ID', 'Verification confirmation screenshot'];
  } else if (lower.includes('supermarket') || lower.includes('store') || lower.includes('shop') || lower.includes('purchase')) {
    // ONLY set merchant purchase if user explicitly mentions supermarket/shop/purchase
    company = 'Local Partner Merchant';
    categorySlug = 'other-affiliates';
    productService = 'In-Store Purchase Offer';
    userAction = 'In-store purchase with bill receipt upload';
    proofRequirements = ['Original store bill copy with total and date clearly visible'];
  } else if (lower.includes('credit card') || lower.includes('card')) {
    categorySlug = 'credit-cards';
    productService = 'Credit Card Application';
    userAction = 'Credit card application submission';
    proofRequirements = ['Application Reference ID', 'Application confirmation screenshot'];
  } else if (lower.includes('account') || lower.includes('bank') || lower.includes('savings')) {
    categorySlug = 'banking';
    productService = 'Digital Banking';
    userAction = 'Account opening and digital verification';
    proofRequirements = ['Account / Reference Number', 'Welcome confirmation screenshot'];
  } else if (lower.includes('demat') || lower.includes('trading') || lower.includes('stock')) {
    categorySlug = 'demat-investment';
    productService = 'Demat Account';
    userAction = 'Demat account opening and verification';
    proofRequirements = ['Client ID / Account ID', 'Confirmation screenshot'];
  } else if (lower.includes('loan')) {
    categorySlug = 'loans';
    productService = 'Personal Loan';
    userAction = 'Loan application and document submission';
    proofRequirements = ['Loan Application ID', 'Confirmation screenshot'];
  } else if (lower.includes('insurance')) {
    categorySlug = 'insurance';
    productService = 'Insurance Policy';
    userAction = 'Insurance policy application';
    proofRequirements = ['Policy / Proposal Number', 'Receipt screenshot'];
  } else if (lower.includes('app') || lower.includes('download')) {
    categorySlug = 'financial-apps';
    productService = 'Mobile Application';
    userAction = 'App installation and KYC verification';
    proofRequirements = ['Account ID screenshot', 'Transaction confirmation screenshot'];
  }

  // Derive title intelligently from user input
  let title = '';
  if (lower.includes('kotak') && (lower.includes('811') || lower.includes('account'))) {
    title = 'Open Kotak 811 Savings Account';
  } else if (lower.includes('navi')) {
    title = 'Navi App - KYC & First Investment';
  } else if (lower.includes('sbi') && lower.includes('card')) {
    title = 'SBI Credit Card Application';
  } else if (lower.includes('hdfc') && lower.includes('card')) {
    title = 'HDFC Credit Card Application';
  } else if (lower.includes('hdfc') && lower.includes('account')) {
    title = 'HDFC Bank Premier Savings Account';
  } else if (lower.includes('angel one') || lower.includes('angelone')) {
    title = 'Angel One Demat & Trading Account';
  } else {
    // Derive title from first substantive sentence
    const firstLine = cleanInput.split(/\n/)[0].replace(/^[\d\.\-\*#\s]+/, '').trim();
    title = firstLine.length > 55 ? `${firstLine.substring(0, 52)}...` : firstLine;
  }

  // Combine all steps from input into ONE instructions array
  const steps: string[] = [];
  const lines = cleanInput.split('\n').map(l => l.replace(/^[\d\.\-\*#\s]+/, '').trim()).filter(Boolean);
  if (lines.length > 1) {
    for (const l of lines) {
      if (l.length > 5 && !l.toLowerCase().startsWith('reward') && !l.toLowerCase().startsWith('link:') && !l.toLowerCase().startsWith('proof:')) {
        steps.push(l);
      }
    }
  }
  if (steps.length === 0) {
    steps.push('Click Start Task to access the verified partner link.');
    steps.push('Complete the required registration / application process.');
    steps.push('Capture the confirmation reference number or screenshot and submit proof.');
  }

  // Check for additional categories: Shopping, Local Business, Social Media, Education, Services
  if (lower.includes('shopping') || lower.includes('e-commerce') || lower.includes('flipkart') || lower.includes('amazon') || lower.includes('myntra') || lower.includes('ajio')) {
    categorySlug = 'shopping';
    productService = 'Online Shopping Offer';
  } else if (lower.includes('telegram') || lower.includes('youtube') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('twitter') || lower.includes('social media')) {
    categorySlug = 'social-media';
    productService = 'Social Media Channel';
  } else if (lower.includes('course') || lower.includes('education') || lower.includes('learning') || lower.includes('study') || lower.includes('test prep')) {
    categorySlug = 'education';
    productService = 'Educational Program';
  } else if (lower.includes('service') || lower.includes('utility') || lower.includes('cleaning') || lower.includes('repair')) {
    categorySlug = 'services';
    productService = 'Service Offer';
  } else if (lower.includes('local store') || lower.includes('supermarket') || lower.includes('store') || lower.includes('shop') || lower.includes('local business')) {
    categorySlug = 'local-business';
    productService = 'Local Store Offer';
  }

  // Check if proof was explicitly mentioned
  const proofMatch = cleanInput.match(/proof[:\s]+([^\n\.]+)/i);
  if (proofMatch && proofMatch[1].trim()) {
    proofRequirements = [proofMatch[1].trim(), 'Confirmation screenshot'];
  }

  // Financial safety sanitize: never include sensitive items
  const sensitiveKeywords = ['pan', 'aadhaar', 'aadhar', 'otp', 'pin', 'cvv', 'password', 'credential', 'net banking'];
  proofRequirements = proofRequirements.filter(p => !sensitiveKeywords.some(k => p.toLowerCase().includes(k)));
  if (proofRequirements.length === 0) {
    proofRequirements = ['Confirmation screenshot / Reference ID'];
  }

  const missing: string[] = [];
  const missingFields: string[] = [];
  const missingQuestions: string[] = [];

  if (rewardAmount === 0) {
    missing.push('Reward Amount: Information Required');
    missingFields.push('rewardAmount');
    missingQuestions.push('What reward amount should be given for this task?');
  }
  if (destinationUrl === 'Information Required') {
    missing.push('Destination / Affiliate Link: Information Required');
    missingFields.push('destinationUrl');
    missingQuestions.push('Please provide the official affiliate/application URL.');
  }

  const catId = CATEGORY_MAP[categorySlug] || 'cat_other';
  const tempId = `ai_draft_${Date.now()}_1`;

  const duplicateCheck = checkForDuplicates(
    { title, company },
    existingTasks,
    []
  );

  const draft: AIDraftTaskResult & { eligibility?: string; missingFields?: string[]; missingQuestions?: string[] } = {
    id: tempId,
    tempId,
    title,
    company,
    productService,
    description: cleanInput,
    userAction,
    instructions: steps,
    rewardAmount,
    proofRequirements,
    destinationUrl: destinationUrl === 'Information Required' ? '' : destinationUrl,
    validDates: 'Information Required',
    participantLimit: null,
    terms: 'Verified reward payable upon compliance approval and partner audit confirmation.',
    categorySlug,
    categoryId: catId,
    eligibility: '',
    missingInfo: missing,
    missingFields,
    missingQuestions,
    isReviewRequired: missingFields.length > 0,
    isDuplicate: duplicateCheck.isDuplicate,
    duplicateWarning: duplicateCheck.warning,
    status: missingFields.length > 0 ? 'review_required' : 'ready',
    rawInputSnippet: cleanInput
  };

  return {
    success: true,
    tasks: [draft], // STRICTLY ONE DRAFT
    rawInput: cleanInput,
    canManualCreate: true,
    stats: {
      totalDetected: 1,
      successful: 0,
      failed: 1
    }
  };
}

/**
 * AI Assistant for Advertiser / Partner Campaign Enquiry collection.
 * Dynamically understands diverse partner types:
 * - Companies / Brands
 * - Social Media Influencers / Creators
 * - Local Stores / Businesses
 * - Affiliate Partners
 * - Agencies
 * - App / Website Owners
 * - Service Providers
 * - Other businesses
 * 
 * Never forces irrelevant questions or assumes fixed questionnaires.
 * Never requires affiliate links (marks as to be arranged by Admin if not provided).
 * Enforces mandatory contact details (Name, Business Name, Email, Phone, WhatsApp).
 */
export async function processCampaignEnquiryAI(
  userMessage: string,
  existingState?: Partial<CampaignEnquiryExtracted>
): Promise<CampaignEnquiryExtracted> {
  const ai = getGeminiClient();

  const currentPartnerType = existingState?.partnerType || 'company';
  const defaultResult: CampaignEnquiryExtracted = {
    partnerType: currentPartnerType,
    businessName: existingState?.businessName || existingState?.companyName || '',
    contactPerson: existingState?.contactPerson || existingState?.advertiserName || '',
    productService: existingState?.productService || '',
    desiredResult: existingState?.desiredResult || existingState?.objective || '',
    promotionRequirement: existingState?.promotionRequirement || '',
    targetAudience: existingState?.targetAudience || '',
    targetLocation: existingState?.targetLocation || '',
    expectedVolume: existingState?.expectedVolume || '',
    budget: existingState?.budget || '',
    duration: existingState?.duration || existingState?.timelines || '',
    specificConditions: existingState?.specificConditions || existingState?.notes || '',
    trackingUrl: existingState?.trackingUrl || existingState?.affiliateUrl || '',
    trackingUrlArrangedByAdmin: existingState?.trackingUrlArrangedByAdmin !== undefined ? existingState.trackingUrlArrangedByAdmin : true,
    creatorPlatforms: existingState?.creatorPlatforms || [],
    socialMediaProfiles: existingState?.socialMediaProfiles || '',
    website: existingState?.website || '',
    businessLocation: existingState?.businessLocation || '',
    officialEmail: existingState?.officialEmail || existingState?.contactEmail || '',
    phoneNumber: existingState?.phoneNumber || existingState?.contactMobile || '',
    whatsappNumber: existingState?.whatsappNumber || existingState?.contactMobile || '',
    missingFields: [],
    aiSummary: '',
    nextQuestion: '',

    // Backward compatibility aliases
    advertiserName: existingState?.contactPerson || existingState?.advertiserName || '',
    companyName: existingState?.businessName || existingState?.companyName || '',
    contactEmail: existingState?.officialEmail || existingState?.contactEmail || '',
    contactMobile: existingState?.phoneNumber || existingState?.contactMobile || '',
    objective: existingState?.desiredResult || existingState?.objective || '',
    rewardPerAction: existingState?.rewardPerAction || 50,
    requiredProof: existingState?.requiredProof || [],
    timelines: existingState?.duration || existingState?.timelines || '',
    affiliateUrl: existingState?.trackingUrl || existingState?.affiliateUrl || '',
    notes: existingState?.specificConditions || existingState?.notes || ''
  };

  if (!ai) {
    // Quick heuristic extraction if API not yet configured
    const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = userMessage.match(/(?:\+91|91|0)?[6-9]\d{9}/);
    const budgetMatch = userMessage.match(/(?:₹|rs\.?|budget|inr)\s*(\d[\d,]*)/i);
    const urlMatch = userMessage.match(/https?:\/\/[^\s]+/i);

    if (emailMatch && !defaultResult.officialEmail) {
      defaultResult.officialEmail = emailMatch[0];
      defaultResult.contactEmail = emailMatch[0];
    }
    if (phoneMatch && !defaultResult.phoneNumber) {
      defaultResult.phoneNumber = phoneMatch[0];
      defaultResult.whatsappNumber = phoneMatch[0];
      defaultResult.contactMobile = phoneMatch[0];
    }
    if (budgetMatch && !defaultResult.budget) defaultResult.budget = budgetMatch[1].replace(/,/g, '');
    if (urlMatch && !defaultResult.trackingUrl) {
      defaultResult.trackingUrl = urlMatch[0];
      defaultResult.trackingUrlArrangedByAdmin = false;
    }
    if (!defaultResult.desiredResult) defaultResult.desiredResult = userMessage;

    defaultResult.aiSummary = `Enquiry from ${defaultResult.businessName || 'Partner'} for ${defaultResult.desiredResult || 'Promotion'}.`;
    defaultResult.nextQuestion = defaultResult.officialEmail && defaultResult.phoneNumber
      ? "Would you like to review and confirm this partnership enquiry?"
      : "Could you please share your Official Email and WhatsApp/Phone number so our Admin team can connect with you?";
    return defaultResult;
  }

  try {
    const prompt = `
You are the intelligent Partner & Campaign Enquiry Assistant for DSK TaskMarketer.
DSK TaskMarketer is a multi-dimensional task and promotion platform.
Partners can be:
- 'company': Companies & Brands
- 'creator': Social Media Influencers / Content Creators
- 'local_business': Local Stores / Retail Shops / Restaurants
- 'affiliate_partner': Affiliate Partners / Networks
- 'agency': Marketing / Advertising Agencies
- 'app_owner': App / Website / SaaS Owners
- 'service_provider': Professional / Local Service Providers
- 'other': Other customized business models

CRITICAL RULES:
1. NEVER assume every partner has the same requirements.
2. DO NOT ask irrelevant questions or show a fixed questionnaire.
3. For Apps/Websites: Ask about actions (installs, signups, reviews), platforms (Android/iOS/Web), target geography.
4. For Local Stores: Ask about store name, location/city (e.g. Chennai, Coimbatore, Madurai), foot-traffic vs offline visits, customer profile.
5. For Creators/Influencers: Ask about channels (Instagram, YouTube), content niche, expected reach/sponsorship, audience profile.
6. For Companies/Brands: Ask about campaign objective, product/service, target audience, budget, duration.
7. For Affiliate Partners: Ask about commission/payout structure, product/service, expected volume.
8. For Agencies: Ask about client/brand, campaign objective, required volume, budget.
9. AFFILIATE / TRACKING LINK IS OPTIONAL: Never require or force a tracking link. If they have one, extract it. If not, set trackingUrlArrangedByAdmin: true.
10. STRICT FIELD INTEGRITY - NEVER MAP CAMPAIGN ANSWERS INTO CONTACT FIELDS:
    - NEVER use sentences like "I will promote my product", "promote app", "want user acquisition" as contactPerson!
    - ONLY extract contactPerson if the user explicitly provides their personal human full name (e.g. "My name is Rahul Sharma").
    - NEVER copy phoneNumber into whatsappNumber. They must remain completely separate.
    - NEVER combine email and phone into one field.
11. Support English, Tamil, and Tanglish naturally. Respond in the same language or polite English with warmth.

Current Existing Details:
${JSON.stringify(existingState || {}, null, 2)}

User's Latest Message:
"""
${userMessage}
"""

Task:
Extract and update all known details into JSON:
- partnerType: one of 'company' | 'creator' | 'local_business' | 'affiliate_partner' | 'agency' | 'app_owner' | 'service_provider' | 'other' (detect from context if not already set)
- businessName: Company, Brand, Store, Creator, or Agency name (ONLY if explicitly given as the business name, never from a campaign action sentence)
- contactPerson: Human full name of contact person (ONLY if explicitly given as a person's name, NEVER a campaign description)
- productService: What product, service, app, or offering is being promoted
- desiredResult: What result do they want? (e.g. leads, app installs, store visits, video views, brand awareness, signups, sales)
- promotionRequirement: Description of promotion, tasks, or content needed
- targetAudience: Specific target demographic (age group, students, salaried, etc.)
- targetLocation: Targeted city/district/state (e.g., Chennai, Tamil Nadu, Pan-India)
- expectedVolume: Expected number of users, completions, leads, or sales (if mentioned)
- budget: Expected budget or payout (in INR, e.g. "₹25,000", "50,000", "Flexible")
- duration: Preferred timeframe or duration (e.g. "15 Days", "1 Month")
- specificConditions: Any special guidelines, conditions, or terms
- trackingUrl: Any tracking, affiliate, app store, or website URL provided (or empty string if none)
- trackingUrlArrangedByAdmin: boolean (false if partner provided their own trackingUrl, true if none provided)
- creatorPlatforms: Array of platforms if creator/influencer (e.g. ["Instagram", "YouTube"])
- socialMediaProfiles: Handles or links to social profiles if creator or store
- website: Official website if provided
- businessLocation: Physical address or city if local business/store
- officialEmail: Official email address (valid email only)
- phoneNumber: Phone number (numbers only)
- whatsappNumber: WhatsApp number (ONLY if explicitly given for WhatsApp, do not infer from phone)
- missingFields: Array of strings listing only the truly critical missing information needed next (prioritize mandatory contact info and core requirement)
- aiSummary: A concise, tailored summary containing ONLY information relevant to this specific partner type (do not display empty or inapplicable fields).
- nextQuestion: A natural, conversational follow-up question asking ONLY for the next 1 or 2 relevant missing details. If everything essential is provided, invite them to review the summary and submit!

Return ONLY valid JSON matching this schema.
`;

    const { text: responseText } = await callGeminiWithFallback(ai, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(responseText || '{}');

    // Extra safety: sanitize contactPerson to prevent campaign answers like "I will promote my product"
    let contactPerson = (parsed.contactPerson || defaultResult.contactPerson || '').trim();
    if (contactPerson && /(promote|product|campaign|service|install|download|action|marketing|advertis|i will|we want|i want)/i.test(contactPerson)) {
      contactPerson = defaultResult.contactPerson || '';
    }

    const partnerType = parsed.partnerType || defaultResult.partnerType || 'company';
    const businessName = parsed.businessName || defaultResult.businessName || '';
    const officialEmail = parsed.officialEmail || defaultResult.officialEmail || '';
    const phoneNumber = parsed.phoneNumber || defaultResult.phoneNumber || '';
    const whatsappNumber = parsed.whatsappNumber || defaultResult.whatsappNumber || '';
    const trackingUrl = parsed.trackingUrl || defaultResult.trackingUrl || '';
    const trackingUrlArrangedByAdmin = trackingUrl ? false : (parsed.trackingUrlArrangedByAdmin !== undefined ? parsed.trackingUrlArrangedByAdmin : true);

    return {
      partnerType,
      businessName,
      contactPerson,
      productService: parsed.productService || defaultResult.productService || '',
      desiredResult: parsed.desiredResult || defaultResult.desiredResult || '',
      promotionRequirement: parsed.promotionRequirement || defaultResult.promotionRequirement || '',
      targetAudience: parsed.targetAudience || defaultResult.targetAudience || '',
      targetLocation: parsed.targetLocation || defaultResult.targetLocation || '',
      expectedVolume: parsed.expectedVolume || defaultResult.expectedVolume || '',
      budget: parsed.budget || defaultResult.budget || '',
      duration: parsed.duration || defaultResult.duration || '',
      specificConditions: parsed.specificConditions || defaultResult.specificConditions || '',
      trackingUrl,
      trackingUrlArrangedByAdmin,
      creatorPlatforms: Array.isArray(parsed.creatorPlatforms) ? parsed.creatorPlatforms : defaultResult.creatorPlatforms,
      socialMediaProfiles: parsed.socialMediaProfiles || defaultResult.socialMediaProfiles || '',
      website: parsed.website || defaultResult.website || '',
      businessLocation: parsed.businessLocation || defaultResult.businessLocation || '',
      officialEmail,
      phoneNumber,
      whatsappNumber,
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      aiSummary: parsed.aiSummary || `Enquiry from ${businessName || 'Partner'} for ${parsed.desiredResult || 'Promotion'}.`,
      nextQuestion: parsed.nextQuestion || '',

      // Backward compatibility aliases
      advertiserName: contactPerson,
      companyName: businessName,
      contactEmail: officialEmail,
      contactMobile: phoneNumber,
      objective: parsed.desiredResult || defaultResult.desiredResult || '',
      rewardPerAction: Number(defaultResult.rewardPerAction) || 50,
      requiredProof: Array.isArray(defaultResult.requiredProof) ? defaultResult.requiredProof : ['Action confirmation screenshot / Reference ID'],
      timelines: parsed.duration || defaultResult.duration || '30 Days',
      affiliateUrl: trackingUrl,
      notes: parsed.specificConditions || defaultResult.specificConditions || ''
    };
  } catch (err: any) {
    console.log('[AI Campaign Enquiry] Notice: Switching to fallback heuristic extraction:', err?.message);
    const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = userMessage.match(/(?:\+91|91|0)?[6-9]\d{9}/);
    const budgetMatch = userMessage.match(/(?:₹|rs\.?|budget|inr)\s*(\d[\d,]*)/i);
    const urlMatch = userMessage.match(/https?:\/\/[^\s]+/i);

    if (emailMatch && !defaultResult.officialEmail) {
      defaultResult.officialEmail = emailMatch[0];
      defaultResult.contactEmail = emailMatch[0];
    }
    if (phoneMatch && !defaultResult.phoneNumber) {
      defaultResult.phoneNumber = phoneMatch[0];
      defaultResult.contactMobile = phoneMatch[0];
    }
    // Check if user specifically designated whatsapp
    if (phoneMatch && /whatsapp|wa/i.test(userMessage) && !defaultResult.whatsappNumber) {
      defaultResult.whatsappNumber = phoneMatch[0];
    }
    if (budgetMatch && !defaultResult.budget) defaultResult.budget = budgetMatch[1].replace(/,/g, '');
    if (urlMatch && !defaultResult.trackingUrl) {
      defaultResult.trackingUrl = urlMatch[0];
      defaultResult.trackingUrlArrangedByAdmin = false;
    }
    if (!defaultResult.desiredResult && !/(phone|email|whatsapp|contact|call)/i.test(userMessage)) {
      defaultResult.desiredResult = userMessage;
    }

    defaultResult.aiSummary = `Enquiry from ${defaultResult.businessName || 'Partner'}. Requirement: ${defaultResult.desiredResult}.`;
    defaultResult.nextQuestion = "Please review the summary details below, or share any additional requirements before confirming.";
    return defaultResult;
  }
}
