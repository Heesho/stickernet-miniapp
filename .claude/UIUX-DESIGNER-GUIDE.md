# UI/UX Designer Expert Subagent Guide

## Overview

This document provides comprehensive guidance for using the UI/UX Designer Expert subagent configuration for your StickerNet miniapp project. The agent specializes in mobile-first design patterns inspired by Robinhood's clean financial interfaces and Pinterest's visual discovery patterns.

## Quick Start

### 1. Agent Configuration
The agent configuration is stored in `uiux-designer-agent.json` and includes:
- Robinhood-inspired financial UI patterns
- Pinterest-inspired content discovery patterns
- Mobile-first design principles
- Comprehensive component specifications
- Accessibility guidelines

### 2. Current Project Analysis

Based on your existing codebase, I've identified these key design elements:

**Existing Design System:**
- **Colors**: Blue primary (#0052FF), clean neutral palette
- **Typography**: Geist font family with proper weight hierarchy
- **Layout**: Pinterest-style masonry grid for image content
- **Components**: Card-based architecture with glassmorphism effects
- **Interactions**: Pull-to-refresh, infinite scroll, modal overlays

**Strengths:**
- Mobile-first responsive design
- Clean card-based layouts
- Smooth animations and transitions
- Good use of CSS custom properties for theming
- Touch-friendly navigation patterns

## Design Pattern Implementation

### 1. Robinhood-Inspired Financial UI

#### Clean Data Display
```tsx
// Price display with clear hierarchy
<div className="bg-black p-2 rounded-xl">
  <div className="text-white text-xs font-medium mb-1">Price</div>
  <div className="text-white text-xl font-bold">
    ${price.toFixed(2)}
  </div>
</div>
```

#### Trading Interface Pattern
- **Quick Actions**: One-tap interactions with confirmation
- **Real-time Updates**: Smooth price animations
- **Status Indicators**: Clear success/error states
- **Minimal Chrome**: Focus on data, not decoration

### 2. Pinterest-Inspired Content Discovery

#### Masonry Layout Implementation
Your existing masonry grid is well-implemented:
```tsx
<div className="columns-2 gap-4">
  {curates.map((curate, index) => (
    <CurateImage key={curate.id} curate={curate} />
  ))}
</div>
```

#### Recommendations for Enhancement:
- **Lazy Loading**: Add intersection observer for better performance
- **Image Aspect Ratios**: Consider maintaining consistent aspect ratios
- **Hover States**: Add subtle hover effects for desktop users

### 3. Mobile-First Optimizations

#### Touch Target Guidelines
```css
/* Minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}
```

#### Safe Area Considerations
```css
/* Bottom navigation safe area */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Component Design Specifications

### 1. Enhanced Button Component

Your existing button component is solid. Here are recommendations for enhancement:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  hapticFeedback?: boolean;
  ariaLabel?: string;
}

// Enhanced with loading and haptic feedback
export function Button({ loading, hapticFeedback, ...props }: ButtonProps) {
  const handleClick = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50); // Light haptic feedback
    }
    props.onClick?.();
  };

  return (
    <button
      className={getButtonClasses(props)}
      onClick={handleClick}
      disabled={props.disabled || loading}
      aria-label={props.ariaLabel}
    >
      {loading && <LoadingSpinner />}
      {props.children}
    </button>
  );
}
```

### 2. Enhanced Card Component

```tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  loading?: boolean;
}

export function Card({ variant = 'default', hover = false, ...props }: CardProps) {
  const baseClasses = "rounded-xl overflow-hidden transition-all duration-200";
  const variantClasses = {
    default: "bg-[var(--app-card-bg)] border border-[var(--app-card-border)]",
    elevated: "bg-[var(--app-card-bg)] shadow-lg",
    outlined: "border-2 border-[var(--app-accent)] bg-transparent",
    interactive: "bg-[var(--app-card-bg)] hover:shadow-xl cursor-pointer"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hover ? 'hover:scale-102' : ''}`}>
      {props.loading ? <CardSkeleton /> : props.children}
    </div>
  );
}
```

### 3. Image Gallery Component

Enhanced version of your existing image grid:

```tsx
interface ImageGalleryProps {
  images: ImageData[];
  columns?: 2 | 3 | 4;
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9';
  lazy?: boolean;
}

export function ImageGallery({ 
  images, 
  columns = 2, 
  aspectRatio = 'auto',
  lazy = true 
}: ImageGalleryProps) {
  return (
    <div className={`columns-${columns} gap-4`}>
      {images.map((image, index) => (
        <MasonryImage
          key={image.id}
          image={image}
          aspectRatio={aspectRatio}
          lazy={lazy}
          priority={index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  );
}
```

## Accessibility Enhancements

### 1. Keyboard Navigation
```tsx
// Enhanced keyboard support
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      onClick?.();
      break;
    case 'Escape':
      onClose?.();
      break;
  }
};
```

### 2. Screen Reader Support
```tsx
// Better ARIA labels and descriptions
<button
  aria-label={`Curate ${curate.token.name} for $${price}`}
  aria-describedby={`curate-description-${curate.id}`}
  role="button"
>
  Curate
</button>
```

### 3. Focus Management
```tsx
// Focus trap for modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function Modal({ isOpen, onClose, children }) {
  const focusTrapRef = useFocusTrap(isOpen);
  
  return (
    <div ref={focusTrapRef} className="modal">
      {children}
    </div>
  );
}
```

## Performance Optimizations

### 1. Image Optimization
```tsx
// Progressive image loading
export function OptimizedImage({ src, alt, ...props }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
```

### 2. Virtual Scrolling for Large Lists
```tsx
import { FixedSizeList as List } from 'react-window';

export function VirtualizedGrid({ items, height = 400 }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <CurateImage curate={items[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Animation Guidelines

### 1. Micro-interactions
```css
/* Smooth button interactions */
.button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.button:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
```

### 2. Page Transitions
```tsx
// Smooth page transitions with Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children, key }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## Dark Mode Implementation

Your existing dark mode is good. Here are enhancements:

```css
/* Enhanced dark mode with better contrast */
@media (prefers-color-scheme: dark) {
  :root {
    --app-background: #000000;
    --app-foreground: #ffffff;
    --app-foreground-muted: #a1a1aa;
    --app-card-bg: rgba(24, 24, 27, 0.8);
    --app-card-border: rgba(63, 63, 70, 0.4);
  }
}
```

## Testing Strategies

### 1. Visual Regression Testing
```javascript
// Storybook stories for components
export default {
  title: 'Components/Button',
  component: Button,
};

export const AllVariants = () => (
  <div className="space-y-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);
```

### 2. Accessibility Testing
```javascript
// Jest + Testing Library accessibility tests
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button should be accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Design System Integration

### 1. Token Management
```typescript
// Design tokens as TypeScript constants
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#0052ff',
      900: '#1e3a8a',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
  },
} as const;
```

### 2. Component Documentation
Create a design system documentation site with:
- Component API documentation
- Usage examples
- Do's and don'ts
- Accessibility guidelines
- Code snippets

## Recommended Next Steps

1. **Implement Enhanced Components**: Update existing components with the specifications above
2. **Add Performance Optimizations**: Implement virtual scrolling and better image loading
3. **Enhance Accessibility**: Add keyboard navigation and screen reader support
4. **Create Component Library**: Build a Storybook for your design system
5. **Set Up Testing**: Add visual regression and accessibility testing
6. **Mobile Testing**: Test on real devices for touch interactions
7. **Performance Audit**: Run Lighthouse audits and optimize Core Web Vitals

## Resources

- **Design Systems**: [Robinhood Design](https://robinhood.design/), [Pinterest Design](https://gestalt.netlify.app/)
- **Accessibility**: [WebAIM Guidelines](https://webaim.org/), [a11y Checklist](https://www.a11yproject.com/)
- **Performance**: [Web.dev](https://web.dev/), [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- **Mobile Design**: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [Material Design](https://material.io/)

This guide should serve as a comprehensive reference for implementing world-class mobile UI/UX patterns in your StickerNet application.