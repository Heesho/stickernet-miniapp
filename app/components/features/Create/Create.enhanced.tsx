/**
 * Enhanced Create Component with Advanced Form Loading States
 * 
 * Extends the existing Create component with the new loading system,
 * comprehensive form validation, and transaction loading management.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useReadContract, useWalletClient, usePublicClient } from "wagmi";
import { formatUnits, parseUnits, encodeFunctionData, parseEventLogs } from "viem";
import { Icon } from "../../ui";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { formatCurrency } from "@/lib/utils/formatters";
import { USDC_ADDRESS, USDC_ABI, USDC_DECIMALS, ROUTER_ADDRESS, ROUTER_ABI } from "@/lib/constants";
import { toast } from 'sonner';
import type { CreateProps } from "./Create.types";

// Enhanced loading components
import { 
  useComponentLoading,
  LoadingForm,
  LoadingFormField,
  LoadingInput,
  LoadingButton,
  SubmitButton,
  UploadButton,
  useTransactionWithLoading,
  LoadingCard
} from "@/app/components/ui/Loading";

/**
 * Enhanced create props with loading configuration
 */
export interface CreateEnhancedProps extends CreateProps {
  /** Whether to show global loading indicators */
  showGlobalLoading?: boolean;
  /** Enable form auto-save */
  enableAutoSave?: boolean;
  /** Auto-save interval in ms */
  autoSaveInterval?: number;
  /** Custom loading messages */
  loadingMessages?: {
    saving?: string;
    creating?: string;
    uploading?: string;
    validating?: string;
  };
}

/**
 * Form validation schema
 */
interface FormValidation {
  name?: string;
  symbol?: string;
  imageUrl?: string;
  buyAmount?: string;
}

/**
 * Form state interface
 */
interface FormState {
  name: string;
  symbol: string;
  imageUrl: string;
  buyAmount: string;
  imageError: boolean;
  imageLoading: boolean;
}

/**
 * Enhanced Create component with comprehensive loading states
 */
export function CreateEnhanced({ 
  setActiveTab,
  showGlobalLoading = false,
  enableAutoSave = false,
  autoSaveInterval = 30000,
  loadingMessages = {}
}: CreateEnhancedProps) {
  const { address, isConnected } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Component-level loading management
  const componentLoading = useComponentLoading('Create');
  
  // Transaction management
  const transaction = useTransactionWithLoading();

  // Form state
  const [formState, setFormState] = useState<FormState>({
    name: "",
    symbol: "",
    imageUrl: "",
    buyAmount: "0",
    imageError: false,
    imageLoading: false
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<FormValidation>({});
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get user's USDC balance with loading state
  const { 
    data: usdcBalance, 
    isLoading: isLoadingBalance,
    error: balanceError 
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  const userBalance = usdcBalance 
    ? parseFloat(formatUnits(usdcBalance, USDC_DECIMALS))
    : 0;

  // Form validation
  const validateForm = useCallback((): FormValidation => {
    const errors: FormValidation = {};

    // Name validation
    if (!formState.name.trim()) {
      errors.name = 'Token name is required';
    } else if (formState.name.length < 2) {
      errors.name = 'Token name must be at least 2 characters';
    } else if (formState.name.length > 50) {
      errors.name = 'Token name must be less than 50 characters';
    }

    // Symbol validation
    if (!formState.symbol.trim()) {
      errors.symbol = 'Token symbol is required';
    } else if (formState.symbol.length < 2) {
      errors.symbol = 'Symbol must be at least 2 characters';
    } else if (formState.symbol.length > 10) {
      errors.symbol = 'Symbol must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/.test(formState.symbol.toUpperCase())) {
      errors.symbol = 'Symbol can only contain letters and numbers';
    }

    // Image URL validation
    if (!formState.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required';
    } else if (!isValidUrl(formState.imageUrl)) {
      errors.imageUrl = 'Please enter a valid URL';
    }

    // Buy amount validation
    const buyAmountNum = parseFloat(formState.buyAmount);
    if (isNaN(buyAmountNum) || buyAmountNum < 0) {
      errors.buyAmount = 'Please enter a valid amount';
    } else if (buyAmountNum < 1) {
      errors.buyAmount = 'Minimum purchase amount is $1';
    } else if (buyAmountNum > userBalance) {
      errors.buyAmount = `Insufficient balance. You have $${formatCurrency(userBalance)}`;
    }

    return errors;
  }, [formState, userBalance]);

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
    setHasUnsavedChanges(true);
  }, [formState, validateForm]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveFormData();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [formState, enableAutoSave, autoSaveInterval, hasUnsavedChanges]);

  // Save form data to localStorage
  const saveFormData = useCallback(async () => {
    const operationId = componentLoading.startLoading({
      type: 'background_sync',
      message: loadingMessages.saving || 'Saving draft...',
      priority: 'low',
      showGlobally: false
    });

    try {
      localStorage.setItem('create-form-draft', JSON.stringify(formState));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      componentLoading.completeOperation(operationId);
    } catch (error) {
      componentLoading.failOperation(operationId, error);
    }
  }, [formState, componentLoading, loadingMessages]);

  // Load saved form data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('create-form-draft');
      if (saved) {
        const parsedData = JSON.parse(saved);
        setFormState(parsedData);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof FormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle number pad input
  const handleNumberPad = useCallback((value: string) => {
    let newValue = formState.buyAmount;
    
    if (value === '<') {
      // Backspace
      newValue = newValue.length > 1 ? newValue.slice(0, -1) : "0";
    } else if (value === '.') {
      // Decimal point
      if (!newValue.includes('.')) {
        newValue = newValue + '.';
      }
    } else {
      // Number
      if (newValue === "0") {
        newValue = value;
      } else {
        newValue = newValue + value;
      }
    }
    
    handleFieldChange('buyAmount', newValue);
  }, [formState.buyAmount, handleFieldChange]);

  // Image upload handling
  const handleImageUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    handleFieldChange('imageLoading', true);

    const operationId = componentLoading.startLoading({
      type: 'upload',
      message: loadingMessages.uploading || 'Uploading image...',
      priority: 'medium',
      showGlobally: showGlobalLoading
    });

    try {
      // Simulate image upload (replace with actual upload logic)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, create a blob URL
      const imageUrl = URL.createObjectURL(file);
      handleFieldChange('imageUrl', imageUrl);
      handleFieldChange('imageError', false);
      
      componentLoading.completeOperation(operationId);
    } catch (error) {
      handleFieldChange('imageError', true);
      componentLoading.failOperation(operationId, error);
    } finally {
      handleFieldChange('imageLoading', false);
    }
  }, [componentLoading, handleFieldChange, showGlobalLoading, loadingMessages]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix form errors before submitting');
      return;
    }

    // Execute transaction
    const hash = await transaction.execute({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'createToken',
      args: [
        formState.name,
        formState.symbol,
        formState.imageUrl,
        parseUnits(formState.buyAmount, USDC_DECIMALS)
      ],
      type: 'create',
      description: `Creating token: ${formState.name} (${formState.symbol})`,
      showGlobalLoading,
      successMessage: `Successfully created ${formState.name} token!`,
      onSuccess: (receipt) => {
        // Clear form on success
        setFormState({
          name: "",
          symbol: "",
          imageUrl: "",
          buyAmount: "0",
          imageError: false,
          imageLoading: false
        });
        
        // Clear saved draft
        localStorage.removeItem('create-form-draft');
        setHasUnsavedChanges(false);
        
        // Navigate to the new token board
        if (setActiveTab) {
          setActiveTab('home');
        }
      },
      onError: (error) => {
        console.error('Token creation failed:', error);
      }
    });

  }, [validateForm, formState, transaction, showGlobalLoading, setActiveTab]);

  // Form validity check
  const isFormValid = useMemo(() => {
    const errors = validateForm();
    return Object.keys(errors).length === 0;
  }, [validateForm]);

  // Loading states
  const isSubmitting = transaction.isLoading;
  const hasFormErrors = Object.keys(validationErrors).length > 0;

  // Connection check
  if (!isConnected || !isValidConnection) {
    return (
      <LoadingCard
        empty
        emptyMessage="Please connect your wallet to create a token"
        className="min-h-96 m-4"
        variant="outlined"
        size="lg"
      />
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Form header with save status */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--app-foreground)] mb-2">
          Create Token
        </h1>
        {enableAutoSave && (
          <div className="flex items-center text-sm text-[var(--app-foreground-muted)]">
            {hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                Unsaved changes
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Saved {lastSaved.toLocaleTimeString()}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Enhanced form with loading states */}
      <LoadingForm
        loading={false} // Form fields handle individual loading
        submitting={isSubmitting}
        error={transaction.hasError}
        success={transaction.isConfirmed}
        errorMessage={transaction.error?.userMessage}
        successMessage="Token created successfully!"
        submitText="Create Token"
        submittingText={transaction.getProgressMessage()}
        validationErrors={validationErrors}
        onSubmit={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        className="space-y-6"
      >
        {/* Token name field */}
        <LoadingFormField
          label="Token Name"
          required
          error={validationErrors.name}
          description="Choose a unique name for your token"
        >
          <LoadingInput
            value={formState.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., My Amazing Token"
            disabled={isSubmitting}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
        </LoadingFormField>

        {/* Token symbol field */}
        <LoadingFormField
          label="Token Symbol"
          required
          error={validationErrors.symbol}
          description="A short symbol for your token (2-10 characters)"
        >
          <LoadingInput
            value={formState.symbol}
            onChange={(e) => handleFieldChange('symbol', e.target.value.toUpperCase())}
            placeholder="e.g., MAT"
            disabled={isSubmitting}
            maxLength={10}
            startIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </LoadingFormField>

        {/* Image upload field */}
        <LoadingFormField
          label="Token Image"
          required
          error={validationErrors.imageUrl}
          description="Upload or provide a URL for your token image"
          loading={formState.imageLoading}
        >
          <div className="space-y-3">
            {/* Image preview */}
            {formState.imageUrl && !formState.imageError && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--app-border)]">
                <img
                  src={formState.imageUrl}
                  alt="Token preview"
                  className="w-full h-full object-cover"
                  onError={() => handleFieldChange('imageError', true)}
                />
              </div>
            )}

            {/* Upload button */}
            <UploadButton
              onUpload={handleImageUpload}
              accept="image/*"
              disabled={isSubmitting}
              loading={formState.imageLoading}
              variant="outline"
              size="md"
            >
              Upload Image
            </UploadButton>

            {/* URL input */}
            <LoadingInput
              value={formState.imageUrl}
              onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
              placeholder="Or paste image URL"
              disabled={isSubmitting || formState.imageLoading}
              startIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        </LoadingFormField>

        {/* Balance display */}
        <LoadingCard
          loading={isLoadingBalance}
          error={!!balanceError}
          errorMessage="Failed to load balance"
          showSkeleton
          skeletonConfig={{ showImage: false, showTitle: true, showDescription: false }}
          variant="outlined"
          size="sm"
          className="p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--app-foreground)]">
              USDC Balance:
            </span>
            <span className="text-sm font-bold text-[var(--app-accent)]">
              ${formatCurrency(userBalance)}
            </span>
          </div>
        </LoadingCard>

        {/* Buy amount field with number pad */}
        <LoadingFormField
          label="Initial Purchase Amount"
          required
          error={validationErrors.buyAmount}
          description="Amount of USDC to spend on initial token purchase"
        >
          <div className="space-y-4">
            {/* Amount display */}
            <div className="text-center p-4 bg-[var(--app-card-bg)] border border-[var(--app-border)] rounded-lg">
              <div className="text-3xl font-bold text-[var(--app-foreground)]">
                ${formState.buyAmount}
              </div>
              <div className="text-sm text-[var(--app-foreground-muted)]">
                USDC
              </div>
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map((key) => (
                <LoadingButton
                  key={key}
                  onClick={() => handleNumberPad(key)}
                  disabled={isSubmitting}
                  variant="outline"
                  size="lg"
                  className="h-12 text-lg font-medium"
                >
                  {key === '<' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2h-12m15 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    key
                  )}
                </LoadingButton>
              ))}
            </div>
          </div>
        </LoadingFormField>

        {/* Transaction progress */}
        {transaction.isLoading && (
          <LoadingCard
            loading={false}
            variant="outlined"
            className="p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Transaction Progress</span>
                <span className="text-sm text-[var(--app-foreground-muted)]">
                  {transaction.state.progress}%
                </span>
              </div>
              
              <div className="w-full bg-[var(--app-gray)] rounded-full h-2">
                <div
                  className="bg-[var(--app-accent)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${transaction.state.progress}%` }}
                />
              </div>
              
              <p className="text-sm text-[var(--app-foreground-muted)]">
                {transaction.getStageMessage()}
              </p>

              {transaction.state.hash && (
                <p className="text-xs text-[var(--app-foreground-muted)] font-mono">
                  {transaction.state.hash.slice(0, 20)}...
                </p>
              )}
            </div>
          </LoadingCard>
        )}
      </LoadingForm>
    </div>
  );
}

// Export both the original and enhanced versions
export { Create } from "./Create";
export default CreateEnhanced;