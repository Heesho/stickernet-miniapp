import type { ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';
import type { Address } from 'viem';
import type { TokenId, ContentData, TokenData } from './blockchain.types';

// Base component props
export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly testId?: string;
}

// Polymorphic component props
export type PolymorphicComponentProps<T extends ElementType> = {
  readonly as?: T;
} & ComponentPropsWithoutRef<T> & BaseComponentProps;

// Web3 component props
export interface Web3ComponentProps extends BaseComponentProps {
  readonly chainId?: number;
  readonly account?: Address;
}

// Content display component props
export interface ContentDisplayProps extends BaseComponentProps {
  readonly tokenAddress: Address;
  readonly tokenId: TokenId;
  readonly contentData?: ContentData;
  readonly isLoading?: boolean;
  readonly onError?: (error: Error) => void;
}

export interface TokenDisplayProps extends BaseComponentProps {
  readonly tokenAddress: Address;
  readonly account?: Address;
  readonly tokenData?: TokenData;
  readonly isLoading?: boolean;
  readonly onError?: (error: Error) => void;
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  readonly label: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

export interface TextInputProps extends FormFieldProps {
  readonly type?: 'text' | 'email' | 'password' | 'url';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export interface NumberInputProps extends FormFieldProps {
  readonly value: number | '';
  readonly onChange: (value: number | '') => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
}

export interface AddressInputProps extends FormFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onValidAddress?: (address: Address) => void;
  readonly placeholder?: string;
}

// Button component props
export interface ButtonProps extends BaseComponentProps {
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit' | 'reset';
}

// Modal/Dialog component props
export interface ModalProps extends BaseComponentProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly closeOnOverlayClick?: boolean;
}

// Loading states
export interface LoadingState {
  readonly isLoading: boolean;
  readonly loadingText?: string;
}

export interface ErrorState {
  readonly isError: boolean;
  readonly error?: Error | null;
  readonly errorMessage?: string;
}

export interface AsyncState extends LoadingState, ErrorState {
  readonly isSuccess: boolean;
}

// Hook return types for components
export interface UseContentDataReturn extends AsyncState {
  readonly contentData?: ContentData;
  readonly weeklyReward: string;
  readonly price: string;
  readonly nextPrice: string;
}

export interface UseTokenDataReturn extends AsyncState {
  readonly tokenData?: TokenData;
  readonly refetch?: () => Promise<void>;
}

// Event handler types
export type ClickHandler = () => void;
export type ChangeHandler<T> = (value: T) => void;
export type SubmitHandler<T = unknown> = (data: T) => void | Promise<void>;
export type ErrorHandler = (error: Error) => void;

// Component ref types
export interface ComponentRef {
  readonly focus: () => void;
  readonly blur: () => void;
}

export interface FormRef extends ComponentRef {
  readonly submit: () => void;
  readonly reset: () => void;
  readonly validate: () => boolean;
}

// Theme and styling types
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly neutral: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
}

export interface ComponentVariants {
  readonly size: Record<string, string>;
  readonly variant: Record<string, string>;
  readonly state: Record<string, string>;
}

// Accessibility props
export interface A11yProps {
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-hidden'?: boolean;
  readonly role?: string;
  readonly tabIndex?: number;
}

// Combined props for complex components
export interface ComplexComponentProps extends BaseComponentProps, A11yProps, AsyncState {
  readonly variant?: string;
  readonly size?: string;
}