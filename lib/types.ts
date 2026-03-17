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
  audience: string;
  differentiator: string;
  colors: string;
  bgColor?: string;
  accentColor?: string;
  whatsapp: string;
  phone: string;
  email: string;
  tone: string;
  sections?: string[];
  cta?: string;
}

export interface GenerationResponse {
  html: string;
  error?: string;
}
