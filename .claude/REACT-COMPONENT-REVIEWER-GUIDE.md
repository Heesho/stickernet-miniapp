# React Component Reviewer Expert Agent Guide

This guide provides comprehensive instructions for using the React Component Reviewer Expert subagent to ensure high-quality, accessible, and performant React components in your Stickernet miniapp project.

## Overview

The React Component Reviewer Expert is a specialized subagent designed to provide thorough code reviews focusing on:

- **React Best Practices**: Component composition, hooks optimization, performance considerations
- **Accessibility (a11y)**: WCAG 2.1 AA compliance, semantic HTML, ARIA attributes
- **TypeScript Compliance**: Proper typing, interfaces, generic patterns
- **Mobile-First Design**: Touch interactions, responsive layouts, miniapp optimization
- **Code Quality**: Standards enforcement, naming conventions, documentation

## Quick Start

### 1. Install Required Dependencies

First, install the additional ESLint plugins that have been added to your project:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-jsx-a11y
```

### 2. Running the Linter

Use the enhanced ESLint configuration to identify issues:

```bash
# Run ESLint on all files
npm run lint

# Run ESLint with auto-fix for fixable issues
npm run lint -- --fix

# Run ESLint on specific files
npx eslint app/components/DemoComponents.tsx
```

### 3. Invoking the Reviewer Agent

When requesting a component review, provide specific context about what you want reviewed:

```
@ReactComponentReviewer Please review the Button component in DemoComponents.tsx for:
- Accessibility compliance
- TypeScript typing improvements
- Mobile-first considerations
- Performance optimizations
```

## Review Categories

### 1. React Best Practices Review

**What it checks:**
- Component composition patterns
- Hook usage and dependency arrays
- State management patterns
- Error handling implementation
- Performance optimization opportunities

**Example request:**
```
Please review the Home component for React best practices, specifically:
- Hook optimization (useMemo, useCallback usage)
- Component composition patterns
- State management efficiency
```

### 2. Accessibility Compliance Audit

**What it checks:**
- WCAG 2.1 AA compliance
- Semantic HTML usage
- ARIA attributes and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

**Example request:**
```
Please audit the ImageDetail component for accessibility compliance:
- Keyboard navigation support
- Screen reader announcements
- ARIA labels and roles
- Focus management in modal
```

### 3. TypeScript Compliance Check

**What it checks:**
- Proper prop typing with interfaces
- Generic component patterns
- Event handler typing
- Ref forwarding with types
- Type safety improvements

**Example request:**
```
Please review TypeScript usage in the Card component:
- Prop interface definitions
- Event handler typing
- Generic type opportunities
- Type safety improvements
```

### 4. Mobile-First Optimization

**What it checks:**
- Touch target sizes (minimum 44px)
- Responsive design patterns
- Gesture implementations
- Performance on mobile networks
- Miniapp-specific considerations

**Example request:**
```
Please review mobile-first design in BottomNavigation:
- Touch target accessibility
- Responsive behavior
- Gesture support
- Performance considerations
```

## Specific Component Review Examples

### Button Component Review

```typescript
// Current implementation issues to look for:
export function Button({ children, variant = "primary", size = "md", className = "", onClick, disabled = false, type = "button", icon }: ButtonProps) {
  // Issues: Missing prop validation, accessibility concerns, performance
}
```

**Review request:**
```
@ReactComponentReviewer Please review the Button component focusing on:
1. TypeScript prop interface improvements
2. Accessibility enhancements (ARIA labels, keyboard support)
3. Performance optimizations (memoization if needed)
4. Mobile touch target compliance
```

### Form Component Review

```typescript
// When reviewing form components, focus on:
- Label associations (htmlFor attributes)
- Validation state announcements
- Error message accessibility
- Keyboard navigation
```

**Review request:**
```
@ReactComponentReviewer Please audit the TodoList form for:
1. Form accessibility compliance
2. Label and input associations
3. Error state handling
4. Keyboard navigation patterns
```

### Modal/Dialog Review

```typescript
// ImageDetail modal component issues to check:
- Focus trapping and management
- Escape key handling
- Background scroll prevention
- Screen reader announcements
```

**Review request:**
```
@ReactComponentReviewer Please review the ImageDetail modal component for:
1. Focus management and trapping
2. Keyboard interaction patterns (Escape key)
3. Screen reader accessibility
4. Mobile gesture support
```

## Common Issues and Solutions

### Performance Issues

**Issue**: Creating objects in render
```typescript
// ❌ Bad - Creates new object on every render
<div style={{ marginTop: '10px' }}>

// ✅ Good - Extract to constant or useMemo
const styles = { marginTop: '10px' };
<div style={styles}>
```

**Issue**: Missing memoization for expensive calculations
```typescript
// ❌ Bad - Recalculates on every render
const expensiveValue = complexCalculation(data);

// ✅ Good - Memoize expensive calculations
const expensiveValue = useMemo(() => complexCalculation(data), [data]);
```

### Accessibility Issues

**Issue**: Missing alt text
```typescript
// ❌ Bad - No alt text
<Image src={curate.uri} width={300} height={300} />

// ✅ Good - Descriptive alt text
<Image src={curate.uri} alt={`Curate ${curate.id} by ${curate.creator.id}`} width={300} height={300} />
```

**Issue**: Missing keyboard support
```typescript
// ❌ Bad - Click-only interaction
<div onClick={onClick}>

// ✅ Good - Keyboard support included
<div onClick={onClick} onKeyDown={handleKeyDown} tabIndex={0} role="button">
```

### TypeScript Issues

**Issue**: Missing interface definition
```typescript
// ❌ Bad - Inline prop types
function Component({ title, children, onClick }: { title?: string; children: ReactNode; onClick?: () => void }) {

// ✅ Good - Proper interface
interface ComponentProps {
  title?: string;
  children: ReactNode;
  onClick?: () => void;
}

function Component({ title, children, onClick }: ComponentProps) {
```

### Mobile Issues

**Issue**: Touch targets too small
```typescript
// ❌ Bad - Small touch target
<button className="w-6 h-6">

// ✅ Good - Minimum 44px touch target
<button className="w-11 h-11 min-w-[44px] min-h-[44px]">
```

## Advanced Review Scenarios

### Custom Hook Review

**Request:**
```
@ReactComponentReviewer Please review the useContentData custom hook for:
1. Proper TypeScript return type definitions
2. Dependency array correctness
3. Error handling patterns
4. Performance optimizations
```

### Context Provider Review

**Request:**
```
@ReactComponentReviewer Please audit any Context providers for:
1. Value memoization to prevent unnecessary re-renders
2. Proper TypeScript context typing
3. Error boundary implementation
4. Performance considerations
```

### Complex Component Architecture

**Request:**
```
@ReactComponentReviewer Please review the overall architecture of DemoComponents.tsx:
1. Component composition patterns
2. Separation of concerns
3. Reusability and maintainability
4. Performance implications of large file
```

## Integration with Development Workflow

### Pre-commit Hooks

Add lint-staged to run the reviewer automatically:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### CI/CD Integration

Include component review checks in your pipeline:

```yaml
- name: Lint and Type Check
  run: |
    npm run lint
    npm run type-check
```

### Code Review Process

1. **Developer Self-Review**: Run ESLint and fix obvious issues
2. **Automated Review**: Use the agent for comprehensive analysis
3. **Peer Review**: Human review focusing on business logic
4. **Accessibility Testing**: Manual testing with screen readers

## Best Practices for Agent Interaction

### Effective Review Requests

1. **Be Specific**: Focus on particular aspects rather than general reviews
2. **Provide Context**: Explain the component's purpose and constraints
3. **Prioritize Issues**: Specify which areas are most critical
4. **Include Examples**: Show specific code snippets when asking about patterns

### Sample Review Template

```
@ReactComponentReviewer Please review [ComponentName] focusing on:

**Priority Areas:**
1. [Specific area like accessibility, performance, etc.]
2. [Another priority area]

**Context:**
- This component is used for [purpose]
- It's primarily accessed on [mobile/desktop]
- Performance is [critical/normal] for this use case

**Specific Questions:**
- [Any specific concerns or questions]

**Code Location:**
- File: [file path]
- Lines: [specific line numbers if relevant]
```

## Configuration and Customization

### ESLint Rule Customization

You can adjust the ESLint rules in `.eslintrc.json` based on your project needs:

```json
{
  "rules": {
    // Make specific rules more or less strict
    "@typescript-eslint/no-explicit-any": "error", // Change from "warn" to "error"
    "jsx-a11y/click-events-have-key-events": "warn" // Change from "error" to "warn"
  }
}
```

### TypeScript Configuration

Ensure strict mode is enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Measuring Success

### Key Metrics

1. **Accessibility Score**: Use Lighthouse accessibility audit
2. **Performance Metrics**: Core Web Vitals, bundle size
3. **TypeScript Coverage**: Percentage of typed vs any types
4. **ESLint Compliance**: Number of linting errors/warnings

### Tracking Improvements

- Before/after bundle size analysis
- Accessibility score improvements
- Performance metric trends
- Code review feedback quality

## Troubleshooting

### Common ESLint Issues

**Issue**: Plugin not found
```bash
# Solution: Install missing plugins
npm install --save-dev eslint-plugin-jsx-a11y
```

**Issue**: TypeScript parser errors
```bash
# Solution: Update TypeScript ESLint packages
npm update @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Performance Issues

If the reviewer seems slow, try:
1. Reviewing smaller file chunks
2. Focusing on specific review categories
3. Using more specific component targets

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ESLint React Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [JSX A11y Plugin](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

## Getting Help

When encountering issues:

1. Check the ESLint output for specific rule violations
2. Review the component against the checklist in the agent configuration
3. Test manually with keyboard navigation and screen readers
4. Use browser dev tools for accessibility and performance analysis

Remember that the React Component Reviewer Expert is designed to be thorough and educational. Use its feedback to improve not just individual components, but your overall React development skills and patterns.