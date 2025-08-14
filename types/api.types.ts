import type { MiniAppNotificationDetails } from '@farcaster/frame-sdk';

// API Response wrapper types
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly timestamp: string;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Webhook event types
export interface WebhookEvent {
  readonly event: WebhookEventType;
  readonly notificationDetails?: MiniAppNotificationDetails;
  readonly timestamp: string;
}

export type WebhookEventType = 
  | 'frame_added'
  | 'frame_removed'
  | 'notifications_enabled'
  | 'notifications_disabled';

export interface WebhookHeader {
  readonly fid: number;
  readonly key: `0x${string}`;
  readonly timestamp: number;
}

export interface WebhookRequest {
  readonly header: string; // base64url encoded WebhookHeader
  readonly payload: string; // base64url encoded WebhookEvent
}

// Notification types
export interface NotificationRequest {
  readonly fid: number;
  readonly title: string;
  readonly body: string;
  readonly notificationDetails?: MiniAppNotificationDetails | null;
}

export interface NotificationResult {
  readonly state: 'success' | 'error' | 'no_token' | 'rate_limit';
  readonly error?: unknown;
}

// Key Registry types
export interface KeyData {
  readonly state: number;
  readonly keyType: number;
}

export interface FidVerificationRequest {
  readonly fid: number;
  readonly appKey: `0x${string}`;
}

// Environment variable types
export interface EnvVars {
  readonly NEXT_PUBLIC_URL: string;
  readonly NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: string;
  readonly UPSTASH_REDIS_REST_URL?: string;
  readonly UPSTASH_REDIS_REST_TOKEN?: string;
}

// Type guards for API responses
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ApiError } {
  return !response.success && response.error !== undefined;
}

export function isWebhookEventType(value: string): value is WebhookEventType {
  return ['frame_added', 'frame_removed', 'notifications_enabled', 'notifications_disabled'].includes(value);
}

// Utility types for better typing
export type StrictPick<T, K extends keyof T> = {
  readonly [P in K]: T[P];
};

export type StrictOmit<T, K extends keyof T> = StrictPick<T, Exclude<keyof T, K>>;

export type NonNullableFields<T> = {
  readonly [P in keyof T]: NonNullable<T[P]>;
};

// Form validation types
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult<T> {
  readonly isValid: boolean;
  readonly data?: T;
  readonly errors: readonly ValidationError[];
}