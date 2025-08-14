# OnchainKit/MiniAppKit Documentation Guide

This guide outlines the essential documentation that should be included to make the OnchainKit/MiniAppKit expert agent most effective.

## Essential Documentation Sources

### 1. Core OnchainKit Documentation
- **Official Docs**: https://onchainkit.xyz/
- **Component API Reference**: All component props, methods, and examples
- **Utilities Reference**: Helper functions, hooks, and utilities
- **Best Practices Guide**: Official recommendations and patterns
- **Migration Guides**: Version updates and breaking changes
- **Examples Repository**: Official example implementations

### 2. MiniAppKit Documentation
- **MiniKit Provider Setup**: Configuration options and examples
- **Mobile Optimization Guide**: Performance and UX best practices
- **Theme Customization**: Styling and branding options
- **Platform Integration**: Coinbase Wallet specific features
- **Deployment Guide**: Publishing and distribution

### 3. Wagmi Documentation
- **React Hooks Reference**: Complete API for all hooks
- **Configuration Guide**: Chain setup and provider configuration
- **Type Safety Guide**: TypeScript patterns and utilities
- **Error Handling**: Common errors and resolution strategies
- **Performance Best Practices**: Caching and optimization

### 4. Coinbase Smart Wallet Documentation
- **Account Abstraction Features**: Available capabilities and limitations
- **Gas Sponsorship Setup**: Paymaster configuration and policies
- **Security Model**: Safe transaction patterns and user protection
- **Integration Guide**: Wallet connection and interaction patterns

### 5. Viem Documentation
- **Contract Interactions**: Reading and writing to contracts
- **Type Safety**: ABI types and contract typing
- **Chain Management**: Multi-chain patterns and configuration
- **Utilities**: Formatting, parsing, and helper functions

## Project-Specific Context Files

### Current Project Analysis
Based on the StickerNet project, include these specific files and their context:

#### 1. Provider Configuration (`/app/providers.tsx`)
```typescript
// Current setup shows:
- MiniKitProvider configuration with Base Sepolia
- Wagmi configuration with Alchemy RPC
- React Query integration
- Environment variable usage patterns
```

#### 2. Multicall Implementation (`/app/hooks/useMulticall.ts`)
```typescript
// Current patterns demonstrate:
- Custom multicall contract integration
- Complex data aggregation (TokenData, ContentData)
- Proper error handling and loading states
- BigInt handling for tokenIds
- Decimal formatting for different token types
```

#### 3. Package Dependencies (`/package.json`)
```json
// Current stack includes:
- @coinbase/onchainkit: latest
- @farcaster/frame-sdk: ^0.1.8
- wagmi: ^2.16.0
- viem: ^2.27.2
- @tanstack/react-query: ^5
```

### Configuration Files to Include
1. **Environment Variables Template**
   ```env
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=
   NEXT_PUBLIC_ALCHEMY_API_KEY=
   NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
   NEXT_PUBLIC_ICON_URL=
   ```

2. **TypeScript Configuration**
   - tsconfig.json with proper OnchainKit types
   - Type declarations for contract ABIs
   - Wagmi and Viem type configurations

3. **Next.js Configuration**
   - next.config.mjs optimizations for blockchain apps
   - Bundle analysis and optimization settings
   - Mobile-specific optimizations

## Code Examples and Patterns

### 1. Component Integration Patterns
Include examples of:
- OnchainKit components in mini-app context
- Responsive layouts for mobile
- Loading and error states
- Transaction confirmation flows

### 2. Advanced Multicall Patterns
Document:
- Efficient batch reading strategies
- Complex data aggregation patterns
- Caching and optimization techniques
- Error handling for batch operations

### 3. Gas Sponsorship Implementation
Provide examples of:
- Paymaster integration
- Sponsored transaction flows
- Cost estimation and user communication
- Fallback mechanisms

### 4. Mobile Optimization Techniques
Include:
- Performance optimization strategies
- Touch-friendly UI patterns
- Responsive design for blockchain components
- Loading optimization for mobile networks

## Common Issue Resolution

### 1. Transaction Issues
- Gas estimation problems
- Contract interaction failures
- Network switching issues
- Approval workflows

### 2. Connection Problems
- Wallet detection issues
- Network mismatch problems
- Connection persistence
- Mobile wallet specific issues

### 3. Performance Issues
- Bundle size optimization
- Query optimization
- Render optimization
- Mobile performance tuning

### 4. Type Safety Issues
- ABI type generation
- Contract type safety
- Hook type configuration
- Viem type utilities

## Testing Patterns

### 1. Unit Testing
- Component testing with blockchain state
- Hook testing with mock providers
- Contract interaction testing
- Error state testing

### 2. Integration Testing
- End-to-end transaction flows
- Wallet connection testing
- Cross-component interaction testing
- Mobile-specific testing

### 3. Performance Testing
- Bundle size analysis
- Load time optimization
- Mobile performance testing
- Network efficiency testing

## Deployment and Production Considerations

### 1. Environment Configuration
- Production vs. testnet configuration
- API key management
- RPC endpoint configuration
- Error monitoring setup

### 2. Performance Optimization
- Code splitting strategies
- Asset optimization
- Caching strategies
- Mobile-specific optimizations

### 3. Security Considerations
- Contract interaction safety
- User data protection
- Transaction security
- Error information exposure

## Maintenance and Updates

### 1. Dependency Management
- OnchainKit version updates
- Wagmi compatibility
- Viem version coordination
- Breaking change management

### 2. Performance Monitoring
- Bundle size tracking
- Performance metrics
- Error rate monitoring
- User experience metrics

### 3. Security Updates
- Contract security updates
- Dependency vulnerability management
- Security best practice updates
- Audit recommendations

## Agent Enhancement Recommendations

To make the agent most effective, ensure access to:

1. **Live Documentation**: Real-time access to latest documentation
2. **Code Examples**: Comprehensive example repository
3. **Issue Database**: Common problems and solutions
4. **Best Practices**: Continuously updated recommendations
5. **Performance Benchmarks**: Optimization targets and metrics
6. **Security Guidelines**: Latest security recommendations
7. **Mobile Patterns**: Mobile-specific implementation patterns
8. **Integration Guides**: Step-by-step implementation guides

This documentation foundation will enable the agent to provide accurate, current, and contextually appropriate assistance for OnchainKit/MiniAppKit development.