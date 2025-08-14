// Barrel exports for all type definitions
// This provides a single entry point for importing types across the application

// Blockchain and Web3 types
export type {
  TokenId,
  ChainId,
  Wei,
  Gwei,
  ContentData,
  TokenData,
  TransactionRequest,
  TransactionReceipt,
  ContractError,
  NetworkError,
  UserRejectedError,
  Web3Error,
  ContractCallResult,
  WriteContractResult,
} from './blockchain.types';

export {
  Phase,
  isAddress,
  isValidTokenId,
  isValidChainId,
} from './blockchain.types';

// API and webhook types
export type {
  ApiResponse,
  ApiError,
  WebhookEvent,
  WebhookEventType,
  WebhookHeader,
  WebhookRequest,
  NotificationRequest,
  NotificationResult,
  KeyData,
  FidVerificationRequest,
  EnvVars,
  StrictPick,
  StrictOmit,
  NonNullableFields,
  ValidationError,
  ValidationResult,
} from './api.types';

export {
  isApiSuccess,
  isApiError,
  isWebhookEventType,
} from './api.types';

// Component types
export type {
  BaseComponentProps,
  PolymorphicComponentProps,
  Web3ComponentProps,
  ContentDisplayProps,
  TokenDisplayProps,
  FormFieldProps,
  TextInputProps,
  NumberInputProps,
  AddressInputProps,
  ButtonProps,
  ModalProps,
  LoadingState,
  ErrorState,
  AsyncState,
  UseContentDataReturn,
  UseTokenDataReturn,
  ClickHandler,
  ChangeHandler,
  SubmitHandler,
  ErrorHandler,
  ComponentRef,
  FormRef,
  ThemeColors,
  ComponentVariants,
  A11yProps,
  ComplexComponentProps,
} from './components.types';

// Hook types
export type {
  BaseHookReturn,
  UseReadContractReturn,
  UseWriteContractReturn,
  UseContentDataParams,
  UseContentDataReturn as HookUseContentDataReturn,
  UseTokenDataParams,
  UseTokenDataReturn as HookUseTokenDataReturn,
  UseWalletReturn,
  UseTransactionReturn,
  UseBalanceParams,
  UseBalanceReturn,
  UseEnsNameParams,
  UseEnsNameReturn,
  UseEnsAddressParams,
  UseEnsAddressReturn,
  UseNotificationParams,
  UseNotificationReturn,
  UseFormReturn,
  UseLocalStorageReturn,
  UseDebounceReturn,
  UseMediaQueryReturn,
  UsePreviousReturn,
  UseAsyncReturn,
  UseCopyToClipboardReturn,
  UseWindowSizeReturn,
  HookFactory,
  AsyncHook,
  ConditionalHook,
} from './hooks.types';

// Re-export common viem types for convenience
export type { Address, Hash, Hex } from 'viem';

// Global type augmentations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_URL: string;
      readonly NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: string;
      readonly UPSTASH_REDIS_REST_URL?: string;
      readonly UPSTASH_REDIS_REST_TOKEN?: string;
    }
  }
}

// Utility types for the entire application
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireAllOrNone<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> &
  (
    | Required<Pick<T, Keys>>
    | Partial<Record<Keys, never>>
  );

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;