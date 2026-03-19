export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
  error?: string;
}

export interface BusinessInfo {
  name: string;
  industry: string;
  product: string;
  sector: string;
  audience: string;
  differentiator: string;
  colors: string;
  style: string;
  bgColor?: string;
  accentColor?: string;
  whatsapp: string;
  phone: string;
  email: string;
  tone: string;
  cta: string;
  sections?: string[];
}

export interface GenerationResponse {
  html: string;
  error?: string;
}
