import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  MapPin,
  DollarSign,
  Target,
  Calendar,
  Link as LinkIcon,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  Edit3,
  RotateCcw,
  Check,
  ChevronRight,
  Layers,
  HelpCircle,
  Loader2,
  Smartphone,
  Store,
  Users,
  Briefcase,
  Wrench,
  TrendingUp
} from 'lucide-react';
import { CampaignEnquiry, PartnerType, TaskCategory } from '../../types';
import { assistCampaignEnquiryAI, submitCampaignEnquiry } from '../../services/api';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

interface CampaignEnquiryAIAssistantProps {
  initialPartnerType?: PartnerType;
  initialType?: string;
  categories?: TaskCategory[];
  userId?: string;
  userEmail?: string;
  userName?: string;
  onSubmitted?: (enquiry: CampaignEnquiry) => void;
  onSuccess?: (enquiry: CampaignEnquiry) => void;
  onCancel?: () => void;
}

interface PartnerTypeOption {
  type: PartnerType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PARTNER_TYPES: PartnerTypeOption[] = [
  {
    type: 'company',
    title: 'Company / Brand',
    subtitle: 'Corporate brands & startups seeking customer acquisition',
    icon: Building2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  {
    type: 'creator',
    title: 'Social Media Influencer / Creator',
    subtitle: 'YouTubers, Instagram creators & community owners',
    icon: Users,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  {
    type: 'local_business',
    title: 'Local Store / Business',
    subtitle: 'Retail stores, restaurants & local service shops',
    icon: Store,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  {
    type: 'app_owner',
    title: 'App / Website Owner',
    subtitle: 'Mobile apps & websites seeking installs or signups',
    icon: Smartphone,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    type: 'affiliate_partner',
    title: 'Affiliate Partner / Network',
    subtitle: 'Direct affiliate campaigns & performance CPA networks',
    icon: TrendingUp,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    type: 'agency',
    title: 'Agency / Marketer',
    subtitle: 'Managing user acquisition for external clients',
    icon: Briefcase,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    type: 'service_provider',
    title: 'Service Provider',
    subtitle: 'Consulting, coaching, home or financial services',
    icon: Wrench,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  {
    type: 'other',
    title: 'Other Business Model',
    subtitle: 'Customized tasks, leads, sales or survey requirements',
    icon: Sparkles,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800'
  }
];

export const CampaignEnquiryAIAssistant: React.FC<CampaignEnquiryAIAssistantProps> = ({
  initialPartnerType,
  categories = [],
  userId,
  userEmail,
  userName,
  onSubmitted,
  onSuccess,
  onCancel,
}) => {
  const [partnerType, setPartnerType] = useState<PartnerType | null>(initialPartnerType || null);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<CampaignEnquiry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic conversation phase:
  // 0: Select partner type
  // 1: Business name & What do you want to promote?
  // 2: Desired result & Promotion requirement
  // 3: Target audience & Target location
  // 4: Expected volume, Budget & Duration (if known)
  // 5: Tracking/Affiliate Link (OPTIONAL!)
  // 6: Contact Q1 - Full Name (contact_person_name)
  // 7: Contact Q2 - Company / Brand / Store / Creator Name (company_brand_name)
  // 8: Contact Q3 - Official Email (contact_email)
  // 9: Contact Q4 - Phone Number (contact_phone)
  // 10: Contact Q5 - WhatsApp Number (contact_whatsapp)
  // 11: Contact Q6 - Website or Social Profile (website_or_social)
  // 12: Tailored Summary & Confirmation
  const [conversationPhase, setConversationPhase] = useState<number>(initialPartnerType ? 1 : 0);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  // Structured enquiry state
  const [formData, setFormData] = useState<Partial<CampaignEnquiry>>({
    partnerType: initialPartnerType || 'company',
    userId: userId || undefined,
    businessName: '',
    companyName: '',
    contactPerson: '',
    productService: '',
    desiredResult: '',
    promotionRequirement: '',
    category: categories[0]?.name || 'General',
    targetAudience: '',
    targetLocation: '',
    expectedVolume: '',
    budget: '',
    duration: '',
    specificConditions: '',
    trackingUrl: '',
    trackingUrlArrangedByAdmin: true,
    creatorPlatforms: [],
    socialMediaProfiles: '',
    website: '',
    businessLocation: '',
    // Explicit & Separate Contact Fields (Never pre-filled with campaign descriptions)
    contact_person_name: '',
    company_brand_name: '',
    contact_email: '',
    contact_phone: '',
    contact_whatsapp: '',
    website_or_social: '',
    officialEmail: '',
    phoneNumber: '',
    whatsappNumber: '',
    aiSummary: ''
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: "Welcome to DSK TaskMarketer! Tell me what type of business or partnership you are looking for.\n\nSelect an option below or tell me in your own words in English, Tamil, or Tanglish.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationPhase, isEditingSummary]);

  // Mandatory Contact Validation - Checks individual fields strictly
  const validateContacts = (data: Partial<CampaignEnquiry>): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    // 1. Full Name: must be at least 2 chars and NOT contain campaign/action keywords
    const personName = (data.contact_person_name || data.contactPerson || '').trim();
    const isInvalidName = !personName || personName.length < 2 || /(promote|product|campaign|service|install|download|action|marketing|advertis|i will|we want|i want)/i.test(personName);
    if (isInvalidName) {
      missing.push('Full Name (Contact Person)');
    }

    // 2. Company/Brand/Business Name: must be at least 2 chars
    const compName = (data.company_brand_name || data.businessName || data.companyName || '').trim();
    if (!compName || compName.length < 2) {
      missing.push('Company, Brand or Business Name');
    }

    // 3. Official Email: must be valid email format
    const email = (data.contact_email || data.officialEmail || data.contactEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      missing.push('Official Email (valid format)');
    }

    // 4. Phone Number: at least 10 digits
    const phoneDigits = (data.contact_phone || data.phoneNumber || data.contactMobile || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      missing.push('Phone Number (10+ digits)');
    }

    // 5. WhatsApp Number: at least 10 digits
    const waDigits = (data.contact_whatsapp || data.whatsappNumber || '').replace(/\D/g, '');
    if (!waDigits || waDigits.length < 10) {
      missing.push('WhatsApp Number (10+ digits)');
    }

    return { valid: missing.length === 0, missing };
  };

  // Helper to generate dynamic questions based on partner type
  const getDynamicQuestionForPhase = (
    type: PartnerType,
    phase: number,
    currentData: Partial<CampaignEnquiry>
  ): { text: string; quickReplies?: string[] } => {
    switch (phase) {
      case 1: {
        switch (type) {
          case 'app_owner':
            return {
              text: `Great to connect! What is the name of your app or website, and what product/service does it offer?`,
              quickReplies: ['Fintech / Payment App', 'Gaming / Fantasy App', 'E-Commerce / Shopping', 'EdTech / Learning App']
            };
          case 'creator':
            return {
              text: `Awesome to meet you! What is your Creator / Channel name, and which platforms do you primarily create on?`,
              quickReplies: ['YouTube + Instagram', 'Instagram Reels Creator', 'Tech / Finance Influencer', 'Telegram Community Host']
            };
          case 'local_business':
            return {
              text: `Welcome! What is the name of your shop or store, and what products or services do you offer?`,
              quickReplies: ['Retail Fashion Store', 'Restaurant / Cafe', 'Electronics & Gadgets', 'Beauty & Wellness Salon']
            };
          case 'affiliate_partner':
            return {
              text: `Welcome! What is your company/brand name and what affiliate products or offers do you manage?`,
              quickReplies: ['Credit Cards & Banking CPA', 'Demat & Trading Accounts', 'E-Commerce Deals & Cashback', 'SaaS & Subscriptions']
            };
          case 'agency':
            return {
              text: `Welcome! Which agency are you representing, and which client or brand are you planning to run campaigns for?`,
              quickReplies: ['Performance Marketing Agency', 'Client Lead Generation', 'App Growth Marketing', 'Brand Activation Agency']
            };
          case 'service_provider':
            return {
              text: `Welcome! What is the name of your business, and what professional or local services do you provide?`,
              quickReplies: ['Financial & Tax Advisory', 'Education & Coaching', 'Home & Repair Services', 'Design & Tech Services']
            };
          default:
            return {
              text: `Welcome! What is your Company, Brand, or Startup name, and what is your core product or offering?`,
              quickReplies: ['Consumer Brand', 'Fintech Startup', 'E-Commerce Marketplace', 'B2B Software / Platform']
            };
        }
      }

      case 2: {
        switch (type) {
          case 'app_owner':
            return {
              text: `What specific action or result do you want users to complete on ${currentData.businessName || 'your app'}?`,
              quickReplies: ['App Install + OTP Signup', 'KYC Verification', 'First In-App Order', '5-Star App Review + Feedback']
            };
          case 'creator':
            return {
              text: `What type of promotion or collaboration do you need for ${currentData.businessName || 'your channel'}?`,
              quickReplies: ['Brand Sponsorship / Video Integration', 'Task Promotion to My Audience', 'Community Growth & Engagement', 'Affiliate Co-promotion']
            };
          case 'local_business':
            return {
              text: `What result do you want from customers visiting ${currentData.businessName || 'your store'}?`,
              quickReplies: ['In-Store Store Visits & Walk-ins', 'Redeem Offline Discount Coupons', 'Google Maps / Business Reviews', 'Local WhatsApp Enquiries']
            };
          case 'affiliate_partner':
            return {
              text: `What is the commission/reward payout structure, and what is the qualifying user action?`,
              quickReplies: ['CPA: Per Approved Application', 'CPL: Verified Form Lead', 'RevShare / Percentage on Sale', 'Fixed Payout Per Qualified User']
            };
          case 'agency':
            return {
              text: `What campaign objectives or performance metrics are you tasked with delivering?`,
              quickReplies: ['High-Volume Qualified Leads', 'Verified User Acquisitions', 'Performance CPA Conversion', 'Brand Awareness & Social Buzz']
            };
          case 'service_provider':
            return {
              text: `What specific type of inquiries or client bookings do you want to generate?`,
              quickReplies: ['Appointment Bookings', 'Form Enquiries with Phone Callback', 'Direct WhatsApp Inquiries', 'Trial Consultations']
            };
          default:
            return {
              text: `What is your primary campaign objective and desired user action?`,
              quickReplies: ['User Registrations / Signups', 'Lead Generation with Verified Mobile', 'Product Trials / Purchases', 'Brand Awareness & Feedback']
            };
        }
      }

      case 3: {
        switch (type) {
          case 'local_business':
            return {
              text: `Where is your physical store or business located, and what local area or city should be targeted?`,
              quickReplies: ['Chennai (Central & Suburban)', 'Coimbatore City', 'Madurai District', 'Multiple Branches in Tamil Nadu']
            };
          case 'creator':
            return {
              text: `Who is your target audience (e.g. age group, students, tech enthusiasts) and target region?`,
              quickReplies: ['Youth 18–25 (College Students)', 'Young Professionals 22–35', 'Tamil Nadu Audience', 'Pan-India Tamil & English']
            };
          default:
            return {
              text: `What audience demographic and geographic locations should be targeted?`,
              quickReplies: ['Pan-India (All Metro & Tier 2)', 'Tamil Nadu & South India', 'College Students & Young Adults (18–25)', 'Salaried Professionals (22–45)']
            };
        }
      }

      case 4: {
        return {
          text: `Do you have an expected volume (e.g. 500 leads), estimated budget, or preferred campaign duration? (If flexible or not finalized, you can mention "Flexible").`,
          quickReplies: ['Flexible / Discuss with Admin', '100–500 Actions (₹15,000–₹30,000)', '1,000+ Actions (₹50,000+)', '15–30 Days Duration']
        };
      }

      case 5: {
        return {
          text: `Do you already have an Affiliate Link, App Store Link, or Tracking URL? (This is completely optional — our Admin team can arrange or create tracking links for you).`,
          quickReplies: [
            "I don't have a tracking link (Admin can arrange)",
            'Yes, will provide tracking URL',
            'Website link only'
          ]
        };
      }

      // Explicit Contact Phase Questions (Asked ONE BY ONE)
      case 6: {
        return {
          text: `Now I need your contact details so our Admin team can contact you regarding this enquiry.\n\n1. What is your full name?`
        };
      }

      case 7: {
        return {
          text: `2. What is your company, brand, store, creator or business name?`,
          quickReplies: currentData.businessName ? [currentData.businessName] : undefined
        };
      }

      case 8: {
        return {
          text: `3. What is your official email address?`
        };
      }

      case 9: {
        return {
          text: `4. What is your phone number?`
        };
      }

      case 10: {
        const phone = currentData.contact_phone || currentData.phoneNumber;
        return {
          text: `5. What is your WhatsApp number?`,
          quickReplies: phone ? [`Same as Phone Number: ${phone}`, 'Different WhatsApp Number'] : undefined
        };
      }

      case 11: {
        return {
          text: `6. Do you have a website or social media profile?`,
          quickReplies: ["I don't have one (Skip)", "Website link", "Social profile link"]
        };
      }

      default:
        return {
          text: `Thank you! All required details and contact information have been collected.\n\nPlease review your structured enquiry summary and contact details below, then click **Confirm & Submit Enquiry**.`
        };
    }
  };

  const handleSelectPartnerType = (selectedType: PartnerType) => {
    setPartnerType(selectedType);
    setFormData(prev => ({ ...prev, partnerType: selectedType, enquiryType: selectedType }));
    setConversationPhase(1);

    const typeConfig = PARTNER_TYPES.find(p => p.type === selectedType);
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: `I am representing a: ${typeConfig?.title || selectedType}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextQ = getDynamicQuestionForPhase(selectedType, 1, { partnerType: selectedType });
    const aiMsg: Message = {
      id: `ai_${Date.now() + 1}`,
      sender: 'ai',
      text: nextQ.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: nextQ.quickReplies
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!text) return;

    setInputVal('');
    setErrorMessage(null);

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const currentType = partnerType || 'company';
      const updatedData: Partial<CampaignEnquiry> = { ...formData, partnerType: currentType, enquiryType: currentType };

      // PHASE 0: PARTNER CATEGORY SELECTION
      if (conversationPhase === 0) {
        const lower = text.toLowerCase();
        let detectedType: PartnerType = 'company';
        if (lower.includes('creator') || lower.includes('influencer') || lower.includes('youtube') || lower.includes('instagram')) {
          detectedType = 'creator';
        } else if (lower.includes('shop') || lower.includes('store') || lower.includes('local') || lower.includes('hotel') || lower.includes('restaurant')) {
          detectedType = 'local_business';
        } else if (lower.includes('app') || lower.includes('website') || lower.includes('apk') || lower.includes('software')) {
          detectedType = 'app_owner';
        } else if (lower.includes('affiliate') || lower.includes('cpa') || lower.includes('cpl') || lower.includes('network')) {
          detectedType = 'affiliate_partner';
        } else if (lower.includes('agency')) {
          detectedType = 'agency';
        } else if (lower.includes('service') || lower.includes('clinic') || lower.includes('consultant')) {
          detectedType = 'service_provider';
        }
        setPartnerType(detectedType);
        updatedData.partnerType = detectedType;
        setConversationPhase(1);
        const q = getDynamicQuestionForPhase(detectedType, 1, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Understood! You are exploring a ${detectedType.replace('_', ' ')} partnership.\n\n${q.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: q.quickReplies
        }]);
      } 
      // PHASE 1: CAMPAIGN OFFERING / PRODUCT / SERVICE
      else if (conversationPhase === 1) {
        updatedData.productService = text;
        if (!updatedData.businessName) updatedData.businessName = text;
        setConversationPhase(2);
        const q = getDynamicQuestionForPhase(currentType, 2, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Noted: **${text}**.\n\n${q.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: q.quickReplies
        }]);
      } 
      // PHASE 2: DESIRED RESULT & PROMOTION REQUIREMENT
      // NOTE: "I will promote my product" is stored strictly as desiredResult / promotionRequirement, NEVER as contactPerson!
      else if (conversationPhase === 2) {
        updatedData.desiredResult = text;
        updatedData.promotionRequirement = text;
        setConversationPhase(3);
        const q = getDynamicQuestionForPhase(currentType, 3, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Target outcome noted: **${text}**.\n\n${q.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: q.quickReplies
        }]);
      } 
      // PHASE 3: AUDIENCE & GEOGRAPHIC LOCATION
      else if (conversationPhase === 3) {
        updatedData.targetAudience = text;
        updatedData.targetLocation = text;
        setConversationPhase(4);
        const q = getDynamicQuestionForPhase(currentType, 4, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Audience & target location noted.\n\n${q.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: q.quickReplies
        }]);
      } 
      // PHASE 4: BUDGET, VOLUME & DURATION
      else if (conversationPhase === 4) {
        updatedData.budget = text;
        updatedData.duration = 'Flexible';
        setConversationPhase(5);
        const q = getDynamicQuestionForPhase(currentType, 5, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Budget & scope noted.\n\n${q.text}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: q.quickReplies
        }]);
      } 
      // PHASE 5: TRACKING LINK (OPTIONAL)
      // Transition explicitly to Contact Information Phase after this!
      else if (conversationPhase === 5) {
        if (text.includes("don't have") || text.includes('arrange') || text.includes('Skip') || text.toLowerCase().includes('website link only')) {
          updatedData.trackingUrl = '';
          updatedData.trackingUrlArrangedByAdmin = true;
        } else if (text.startsWith('http')) {
          updatedData.trackingUrl = text;
          updatedData.trackingUrlArrangedByAdmin = false;
        } else {
          updatedData.trackingUrl = '';
          updatedData.trackingUrlArrangedByAdmin = true;
        }

        // Switch explicitly to Contact Information Phase
        setConversationPhase(6);
        const q = getDynamicQuestionForPhase(currentType, 6, updatedData);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: (updatedData.trackingUrlArrangedByAdmin
            ? `No problem at all! Our Admin team will arrange and configure the tracking link for your campaign.\n\n`
            : `Tracking link recorded: ${updatedData.trackingUrl}\n\n`) + q.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } 
      // PHASE 6: CONTACT QUESTION 1 - FULL NAME
      else if (conversationPhase === 6) {
        // Validate that this is an actual name, NOT a campaign requirement like "I will promote my product"
        const isCampaignSentence = /(promote|product|campaign|service|install|download|action|marketing|advertis|i will|we want|i want|looking for|my app|my store)/i.test(text);
        if (isCampaignSentence || text.length < 2 || text.length > 70) {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Please provide your actual full name (e.g., Rahul Sharma or Priya Sundaram) so our Admin team knows who to contact regarding this enquiry.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          // Keep phase on 6 so user provides their real name
        } else {
          // Save ONLY to contact_person_name
          updatedData.contact_person_name = text;
          updatedData.contactPerson = text;
          setConversationPhase(7);
          const q = getDynamicQuestionForPhase(currentType, 7, updatedData);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Thank you, **${text}**!\n\n${q.text}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: q.quickReplies
          }]);
        }
      } 
      // PHASE 7: CONTACT QUESTION 2 - COMPANY / BRAND / STORE / CREATOR NAME
      else if (conversationPhase === 7) {
        if (text.length < 2) {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Please provide your company, brand, store, creator or business name.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else {
          // Save ONLY to company_brand_name
          updatedData.company_brand_name = text;
          updatedData.businessName = text;
          updatedData.companyName = text;
          setConversationPhase(8);
          const q = getDynamicQuestionForPhase(currentType, 8, updatedData);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Got it: **${text}**.\n\n${q.text}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } 
      // PHASE 8: CONTACT QUESTION 3 - OFFICIAL EMAIL ADDRESS
      else if (conversationPhase === 8) {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (!emailMatch) {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Please provide a valid official email address (e.g. name@company.com) so our team can send you the campaign details.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else {
          const email = emailMatch[0].toLowerCase();
          // Save ONLY to contact_email
          updatedData.contact_email = email;
          updatedData.officialEmail = email;
          updatedData.contactEmail = email;
          setConversationPhase(9);
          const q = getDynamicQuestionForPhase(currentType, 9, updatedData);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Official email recorded: **${email}**.\n\n${q.text}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } 
      // PHASE 9: CONTACT QUESTION 4 - PHONE NUMBER
      else if (conversationPhase === 9) {
        const phoneDigits = text.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Please enter a valid phone number with at least 10 digits.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else {
          // Save ONLY to contact_phone (DO NOT copy to WhatsApp!)
          updatedData.contact_phone = text;
          updatedData.phoneNumber = text;
          updatedData.contactMobile = text;
          setConversationPhase(10);
          const q = getDynamicQuestionForPhase(currentType, 10, updatedData);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `Phone number saved: **${text}**.\n\n${q.text}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: q.quickReplies
          }]);
        }
      } 
      // PHASE 10: CONTACT QUESTION 5 - WHATSAPP NUMBER
      else if (conversationPhase === 10) {
        if (text.toLowerCase().includes('same') || text.startsWith('Same as Phone')) {
          const samePhone = updatedData.contact_phone || updatedData.phoneNumber || '';
          updatedData.contact_whatsapp = samePhone;
          updatedData.whatsappNumber = samePhone;
          setConversationPhase(11);
          const q = getDynamicQuestionForPhase(currentType, 11, updatedData);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now() + 1}`,
            sender: 'ai',
            text: `WhatsApp number set to: **${samePhone}**.\n\n${q.text}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: q.quickReplies
          }]);
        } else {
          const waDigits = text.replace(/\D/g, '');
          if (waDigits.length < 10) {
            setMessages(prev => [...prev, {
              id: `ai_${Date.now() + 1}`,
              sender: 'ai',
              text: `Please enter a valid WhatsApp number with at least 10 digits (or click "Same as Phone Number").`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickReplies: updatedData.contact_phone ? [`Same as Phone Number: ${updatedData.contact_phone}`] : undefined
            }]);
          } else {
            // Save ONLY to contact_whatsapp
            updatedData.contact_whatsapp = text;
            updatedData.whatsappNumber = text;
            setConversationPhase(11);
            const q = getDynamicQuestionForPhase(currentType, 11, updatedData);
            setMessages(prev => [...prev, {
              id: `ai_${Date.now() + 1}`,
              sender: 'ai',
              text: `WhatsApp number recorded: **${text}**.\n\n${q.text}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickReplies: q.quickReplies
            }]);
          }
        }
      } 
      // PHASE 11: CONTACT QUESTION 6 - WEBSITE OR SOCIAL PROFILE
      else if (conversationPhase === 11) {
        const lower = text.toLowerCase();
        if (lower.includes('skip') || lower.includes('no') || lower.includes("don't") || lower.includes('none') || lower === 'n/a') {
          updatedData.website_or_social = 'Not provided';
          updatedData.website = '';
        } else {
          updatedData.website_or_social = text;
          updatedData.website = text;
        }

        // Summary generation
        const typeLabel = PARTNER_TYPES.find(p => p.type === currentType)?.title || currentType;
        const summary = `Partner Type: ${typeLabel}\nBusiness/Brand: ${updatedData.company_brand_name || updatedData.businessName}\nRequirement: ${updatedData.desiredResult || updatedData.productService}\nTarget Audience: ${updatedData.targetAudience || 'Target Audience'}\nLocation: ${updatedData.targetLocation || 'Tamil Nadu / Pan-India'}\nBudget: ${updatedData.budget || 'Flexible'}\nTracking Link: ${updatedData.trackingUrlArrangedByAdmin ? 'To be arranged by Admin' : (updatedData.trackingUrl || 'Not required')}\nContact Person: ${updatedData.contact_person_name}\nOfficial Email: ${updatedData.contact_email}\nPhone: ${updatedData.contact_phone}\nWhatsApp: ${updatedData.contact_whatsapp}\nWebsite/Social: ${updatedData.website_or_social}`;
        updatedData.aiSummary = summary;

        setConversationPhase(12);
        setMessages(prev => [...prev, {
          id: `ai_${Date.now() + 1}`,
          sender: 'ai',
          text: `Thank you! All required campaign details and contact information have been collected.\n\nPlease review your structured enquiry summary and contact details below, then click **Confirm & Submit Enquiry** to send it directly to our Admin team.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

      setFormData(updatedData);
    } catch (err: any) {
      console.error('Error processing AI response:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = async () => {
    const { valid, missing } = validateContacts(formData);
    if (!valid) {
      setErrorMessage(`Please provide all mandatory contact details before submitting: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const typeLabel = PARTNER_TYPES.find(p => p.type === partnerType)?.title || partnerType;
      const contactPerson = String(formData.contact_person_name || formData.contactPerson || '').trim();
      const companyName = String(formData.company_brand_name || formData.businessName || formData.companyName || '').trim();
      const officialEmail = String(formData.contact_email || formData.officialEmail || '').trim().toLowerCase();
      const phoneNumber = String(formData.contact_phone || formData.phoneNumber || '').trim();
      const whatsappNumber = String(formData.contact_whatsapp || formData.whatsappNumber || '').trim();
      const websiteOrSocial = String(formData.website_or_social || formData.website || '').trim();

      const payload: Partial<CampaignEnquiry> = {
        ...formData,
        partnerType: partnerType || 'company',
        enquiryType: partnerType || 'company',
        businessName: companyName,
        companyName,
        contactPerson,
        contact_person_name: contactPerson,
        company_brand_name: companyName,
        officialEmail,
        contact_email: officialEmail,
        phoneNumber,
        contact_phone: phoneNumber,
        whatsappNumber,
        contact_whatsapp: whatsappNumber,
        website: websiteOrSocial,
        website_or_social: websiteOrSocial,
        desiredResult: formData.desiredResult || formData.productService || 'User Acquisition & Promotion',
        trackingUrlArrangedByAdmin: formData.trackingUrl ? false : true,
        aiSummary: formData.aiSummary || `Partnership enquiry from ${companyName} (${typeLabel}).`
      };

      const result = await submitCampaignEnquiry(payload);
      if (result.success && result.enquiry) {
        setSubmittedEnquiry(result.enquiry);
        if (onSubmitted) {
          onSubmitted(result.enquiry);
        }
        if (onSuccess) {
          onSuccess(result.enquiry);
        }
      } else {
        throw new Error((result as any).error || 'Unable to submit enquiry at this time.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit campaign enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTypeConfig = PARTNER_TYPES.find(p => p.type === partnerType);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">AI Partner & Campaign Assistant</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                DSK TaskMarketer
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 mt-0.5">
              Intelligent partnership discovery for Companies, Creators, Local Stores, Agencies & Apps
            </p>
          </div>
        </div>

        {onCancel && !submittedEnquiry && (
          <button
            onClick={onCancel}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white border border-white/10"
          >
            Cancel
          </button>
        )}
      </div>

      {/* SUCCESS CONFIRMATION STATE */}
      {submittedEnquiry ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Enquiry Submitted Successfully!
            </h3>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              "Thank you for submitting your campaign enquiry. Our team will review your requirements and contact you within 24–48 hours to discuss approval, campaign setup, budget, and live launch."
            </p>
          </div>

          <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Reference Enquiry ID</span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{submittedEnquiry.id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Partner Type</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {submittedEnquiry.partnerType?.replace('_', ' ') || 'Partner'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Business / Brand</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {submittedEnquiry.businessName || submittedEnquiry.companyName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                New (Under Admin Review)
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmittedEnquiry(null);
                setConversationPhase(0);
                setPartnerType(null);
                setMessages([
                  {
                    id: `msg_${Date.now()}`,
                    sender: 'ai',
                    text: "Welcome to DSK TaskMarketer! Tell me what type of business or partnership you are looking for.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition"
            >
              Start Another Enquiry
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-500/20"
              >
                Done
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* STEP 0: PARTNER TYPE SELECTION CARDS */}
          {conversationPhase === 0 && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <div className="mb-4">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Step 1 of 3</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Select Your Business or Partner Category
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Our AI adapts dynamically to your exact business requirements. We never ask irrelevant questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PARTNER_TYPES.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <button
                      key={pt.type}
                      onClick={() => handleSelectPartnerType(pt.type)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${pt.bgColor} ${pt.borderColor} group`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${pt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {pt.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {pt.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE PARTNER BADGE IF SELECTED */}
          {partnerType && currentTypeConfig && (
            <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Partner Type:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${currentTypeConfig.bgColor} ${currentTypeConfig.color} border ${currentTypeConfig.borderColor}`}>
                  {currentTypeConfig.title}
                </span>
              </div>
              <button
                onClick={() => {
                  setConversationPhase(0);
                  setPartnerType(null);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Change Category
              </button>
            </div>
          )}

          {/* CHAT MESSAGES LOG */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[440px] space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* QUICK REPLY SUGGESTION CHIPS */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && !isProcessing && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(qr)}
                          className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-sm"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-[10px] text-slate-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs italic">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
                <span>DSK Partner AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* TAILORED SUMMARY & CONTACT REVIEW (Displayed when all 6 contact details are collected) */}
          {conversationPhase >= 12 && (
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Partnership Enquiry & Verified Contacts
                  </h4>
                </div>
                <button
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingSummary ? 'Done Editing' : 'Edit Information'}
                </button>
              </div>

              {isEditingSummary ? (
                <div className="space-y-4">
                  {/* SEPARATE CONTACT INFORMATION EDIT SECTION */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5" />
                      Contact Information (Mandatory)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">1. Full Name (Contact Person) *</label>
                        <input
                          type="text"
                          value={formData.contact_person_name || formData.contactPerson || ''}
                          onChange={e => setFormData({ ...formData, contact_person_name: e.target.value, contactPerson: e.target.value })}
                          placeholder="e.g., Rahul Sharma"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">2. Company / Brand / Store Name *</label>
                        <input
                          type="text"
                          value={formData.company_brand_name || formData.businessName || ''}
                          onChange={e => setFormData({ ...formData, company_brand_name: e.target.value, businessName: e.target.value, companyName: e.target.value })}
                          placeholder="e.g., TaskFlow Media"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">3. Official Email *</label>
                        <input
                          type="email"
                          value={formData.contact_email || formData.officialEmail || ''}
                          onChange={e => setFormData({ ...formData, contact_email: e.target.value, officialEmail: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">4. Phone Number *</label>
                        <input
                          type="text"
                          value={formData.contact_phone || formData.phoneNumber || ''}
                          onChange={e => setFormData({ ...formData, contact_phone: e.target.value, phoneNumber: e.target.value })}
                          placeholder="10-digit phone number"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">5. WhatsApp Number *</label>
                        <input
                          type="text"
                          value={formData.contact_whatsapp || formData.whatsappNumber || ''}
                          onChange={e => setFormData({ ...formData, contact_whatsapp: e.target.value, whatsappNumber: e.target.value })}
                          placeholder="10-digit WhatsApp number"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">6. Website or Social Profile</label>
                        <input
                          type="text"
                          value={formData.website_or_social || formData.website || ''}
                          onChange={e => setFormData({ ...formData, website_or_social: e.target.value, website: e.target.value })}
                          placeholder="https://... or @profile (Optional)"
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CAMPAIGN SPECIFICATIONS EDIT SECTION */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Campaign Requirements
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Product / Service</label>
                        <input
                          type="text"
                          value={formData.productService || ''}
                          onChange={e => setFormData({ ...formData, productService: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Desired Result / Action</label>
                        <input
                          type="text"
                          value={formData.desiredResult || ''}
                          onChange={e => setFormData({ ...formData, desiredResult: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Target Audience & Location</label>
                        <input
                          type="text"
                          value={formData.targetLocation || formData.targetAudience || ''}
                          onChange={e => setFormData({ ...formData, targetLocation: e.target.value, targetAudience: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Estimated Budget / Scope</label>
                        <input
                          type="text"
                          value={formData.budget || ''}
                          onChange={e => setFormData({ ...formData, budget: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Tracking / Affiliate URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="Optional (Admin will arrange if empty)"
                          value={formData.trackingUrl || ''}
                          onChange={e => setFormData({ ...formData, trackingUrl: e.target.value, trackingUrlArrangedByAdmin: !e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* SEPARATE CONTACT INFORMATION DISPLAY */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Verified Contact Details
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Admin Callback Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">1. Contact Person Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formData.contact_person_name || formData.contactPerson || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">2. Company / Brand Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formData.company_brand_name || formData.businessName || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">3. Official Email</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.contact_email || formData.officialEmail || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">4. Phone Number</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.contact_phone || formData.phoneNumber || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">5. WhatsApp Number</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.contact_whatsapp || formData.whatsappNumber || 'Not provided'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">6. Website / Social Profile</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.website_or_social || formData.website || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CAMPAIGN SPECIFICATIONS DISPLAY */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Campaign & Partnership Scope
                      </span>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {partnerType?.replace('_', ' ') || 'General Partner'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Product / Service</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.productService || 'General Offering'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Desired Result</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.desiredResult || formData.promotionRequirement || 'Acquisition / Promotion'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Target Location & Audience</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.targetLocation || formData.targetAudience || 'Pan-India / Tamil Nadu'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Budget / Volume</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.budget || 'Flexible / Discuss with Admin'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-medium block">Tracking Link</span>
                        <span className={`font-semibold ${formData.trackingUrl ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                          {formData.trackingUrl ? formData.trackingUrl : 'To be arranged by Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Feedback Banner if Mandatory Contact Info is Incomplete */}
              {!validateContacts(formData).valid && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Missing mandatory contact details:</span>
                    <span className="ml-1">
                      {validateContacts(formData).missing.join(', ')}. Please fill these above or continue the chat to enable submission.
                    </span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isEditingSummary ? 'View Summary' : 'Edit Information'}
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || !validateContacts(formData).valid}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting to Admin...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Submit Enquiry
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Type your reply in English, தமிழ் (Tamil), or Tanglish..."
                disabled={isProcessing || isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isProcessing || isSubmitting}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>Supports Tamil, Tanglish & English</span>
              <span>• Tracking links optional • Protected by Supabase</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
