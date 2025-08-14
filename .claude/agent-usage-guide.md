# OnchainKit Expert Agent Usage Guide

This guide explains how to effectively use the OnchainKit/MiniAppKit expert agent for your blockchain development needs.

## How to Activate the Agent

To use the specialized OnchainKit expert agent, start your conversation with:

```
@onchainkit-expert [your question or request]
```

Or reference the agent configuration:
```
Using the OnchainKit expert configuration, help me with...
```

## Common Use Cases

### 1. Component Integration & Setup

**Ask for help with:**
- Setting up OnchainKit components in your mini-app
- Configuring MiniKitProvider with proper settings
- Integrating Wagmi and React Query
- Setting up wallet connection flows

**Example requests:**
```
@onchainkit-expert Help me set up a transaction component with proper error handling and loading states

@onchainkit-expert I need to configure MiniKitProvider for a Base mainnet app with custom theming

@onchainkit-expert Show me how to implement a wallet connection flow that works well on mobile
```

### 2. Multicall & Batch Operations

**Ask for help with:**
- Implementing efficient multicall patterns
- Batching multiple contract reads
- Optimizing data fetching strategies
- Handling complex contract interactions

**Example requests:**
```
@onchainkit-expert Help me optimize this multicall pattern for better performance

@onchainkit-expert I need to batch multiple token operations into a single transaction

@onchainkit-expert Show me how to handle loading states for complex multicall operations
```

### 3. Gas Sponsorship & Paymaster Integration

**Ask for help with:**
- Setting up gas sponsorship for users
- Implementing paymaster patterns
- Handling sponsored transaction flows
- Managing sponsorship policies

**Example requests:**
```
@onchainkit-expert Help me implement gas sponsorship for my mini-app

@onchainkit-expert I need to set up a paymaster that sponsors transactions under certain conditions

@onchainkit-expert Show me how to handle both sponsored and non-sponsored transactions
```

### 4. Mobile Optimization

**Ask for help with:**
- Optimizing performance for mobile devices
- Implementing touch-friendly interfaces
- Reducing bundle sizes
- Improving loading times

**Example requests:**
```
@onchainkit-expert My mini-app is slow on mobile, help me optimize performance

@onchainkit-expert I need to make my blockchain components more mobile-friendly

@onchainkit-expert Help me reduce the bundle size while keeping OnchainKit functionality
```

### 5. Debugging & Troubleshooting

**Ask for help with:**
- Resolving transaction failures
- Fixing connection issues
- Debugging contract interactions
- Solving performance problems

**Example requests:**
```
@onchainkit-expert My transactions are failing with unclear errors, help me debug

@onchainkit-expert Users can't connect their wallets on mobile, what could be wrong?

@onchainkit-expert I'm getting RPC errors intermittently, how do I handle this?
```

## Best Practices for Agent Interaction

### 1. Provide Context
Always include relevant context about your project:

```
@onchainkit-expert I'm building a StickerNet app on Base Sepolia using the latest OnchainKit. 
I need help implementing batch purchasing of multiple stickers with gas sponsorship.
Here's my current setup: [include relevant code]
```

### 2. Include Code Snippets
Share your current implementation when asking for improvements:

```
@onchainkit-expert Here's my current multicall hook, help me optimize it for mobile performance:
[paste your code]
```

### 3. Specify Requirements
Be clear about your specific needs:

```
@onchainkit-expert I need a transaction component that:
- Works on mobile with touch-friendly UI
- Shows clear loading states
- Handles gas estimation
- Supports both sponsored and regular transactions
- Provides clear error messages
```

### 4. Ask About Trade-offs
Request information about different approaches:

```
@onchainkit-expert What are the trade-offs between using multicall vs individual contract calls 
for my use case? I need to read data for 20+ tokens.
```

## Advanced Usage Patterns

### 1. Architecture Review
```
@onchainkit-expert Review my provider setup and suggest improvements for a production mini-app
[include your providers.tsx file]
```

### 2. Performance Analysis
```
@onchainkit-expert Analyze my bundle and suggest optimizations for mobile loading performance
[include webpack-bundle-analyzer output or relevant metrics]
```

### 3. Security Review
```
@onchainkit-expert Review this transaction flow for security best practices and user protection
[include transaction component code]
```

### 4. Migration Assistance
```
@onchainkit-expert Help me migrate from OnchainKit v1 to v2, what breaking changes should I be aware of?
[include current implementation]
```

## Code Examples and Responses

The agent will provide:

### 1. Working Code Examples
- Complete, runnable code snippets
- Proper TypeScript types
- Error handling patterns
- Mobile-optimized implementations

### 2. Step-by-Step Instructions
- Clear implementation steps
- Configuration requirements
- Testing recommendations
- Deployment considerations

### 3. Best Practices Explanations
- Why certain patterns are recommended
- Performance implications
- Security considerations
- Mobile UX guidelines

### 4. Troubleshooting Guides
- Common error patterns and solutions
- Debugging techniques
- Performance optimization steps
- Testing strategies

## Integration with Your Development Workflow

### 1. Planning Phase
Use the agent to:
- Plan component architecture
- Choose optimal patterns
- Estimate implementation complexity
- Identify potential challenges

### 2. Development Phase
Use the agent to:
- Get implementation guidance
- Solve specific problems
- Optimize performance
- Handle edge cases

### 3. Testing Phase
Use the agent to:
- Create test strategies
- Debug failing tests
- Optimize test performance
- Handle mock configurations

### 4. Deployment Phase
Use the agent to:
- Review production configuration
- Optimize for performance
- Set up monitoring
- Handle environment differences

## Expected Response Quality

The OnchainKit expert agent will provide:

✅ **High-quality responses include:**
- Complete, tested code examples
- Mobile-optimized solutions
- Security considerations
- Performance implications
- Clear explanations of trade-offs

✅ **Specialized knowledge areas:**
- OnchainKit component best practices
- MiniAppKit mobile optimization
- Wagmi hook patterns
- Viem utilities usage
- Coinbase Smart Wallet integration
- Gas sponsorship implementation

✅ **Contextual awareness:**
- Your current project structure
- Existing dependencies and versions
- Mobile-first considerations
- Coinbase ecosystem integration

Remember: The agent is specifically tuned for OnchainKit/MiniAppKit development, so it will provide more specialized and accurate guidance compared to general blockchain development assistance.