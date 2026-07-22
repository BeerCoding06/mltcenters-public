import { createContext } from 'react';

export const ANALYTICS_EVENTS = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  PAGE_VIEW: 'page_view',
  ROUTE_CHANGE: 'route_change',
  TIME_ON_PAGE: 'time_on_page',
  SCROLL_DEPTH: 'scroll_depth',
  CLICK: 'click',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  ASSESSMENT_STARTED: 'assessment_started',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  ASSESSMENT_FAILED: 'assessment_failed',
  CHAT_STARTED: 'chat_started',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  SPEECH_STARTED: 'speech_started',
  SPEECH_COMPLETED: 'speech_completed',
  SPEECH_FAILED: 'speech_failed',
  TTS_STARTED: 'tts_started',
  TTS_COMPLETED: 'tts_completed',
  RUNNER_STARTED: 'runner_started',
  RUNNER_FINISHED: 'runner_finished',
  REGISTER_STARTED: 'register_started',
  REGISTER_COMPLETED: 'register_completed',
  CONTACT_SUBMIT: 'contact_submit',
  VOCAB_SESSION_STARTED: 'vocab_session_started',
  VOCAB_WORD_LEARNED: 'vocab_word_learned',
  VOCAB_QUIZ_ANSWERED: 'vocab_quiz_answered',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS] | string;

export type AnalyticsMetadata = Record<string, string | number | boolean | null>;

export type AnalyticsEventInput = {
  name: AnalyticsEventName;
  path?: string;
  referrer?: string;
  metadata?: AnalyticsMetadata;
};

export type AnalyticsContextValue = {
  track: (name: AnalyticsEventName, metadata?: AnalyticsMetadata) => void;
  trackPageView: (path?: string) => void;
  sessionId: string;
  visitorId: string;
};

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
