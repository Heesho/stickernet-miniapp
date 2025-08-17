/**
 * Style constants and utility classes
 * 
 * @description Centralized style definitions for consistent design
 * across the application, including animations, spacing, and common patterns.
 */

/**
 * Animation classes for smooth transitions
 */
export const ANIMATIONS = {
  FADE_IN: 'animate-fade-in',
  SCALE_IN: 'animate-scale-in',
  SLIDE_UP: 'animate-slide-up',
  PULSE: 'animate-pulse',
  SPIN: 'animate-spin',
  NEW_ITEM: 'animate-new-item',
  BOUNCE: 'animate-bounce',
} as const;

/**
 * Common transition durations
 */
export const TRANSITIONS = {
  FAST: 'transition-all duration-200',
  NORMAL: 'transition-all duration-300',
  SLOW: 'transition-all duration-500',
  OPACITY: 'transition-opacity duration-300',
  TRANSFORM: 'transition-transform duration-300',
} as const;

/**
 * Common spacing patterns
 */
export const SPACING = {
  CONTAINER_PADDING: 'px-4 py-3',
  CARD_PADDING: 'p-4',
  SECTION_MARGIN: 'mb-6',
  ELEMENT_MARGIN: 'mb-4',
  SMALL_GAP: 'gap-2',
  MEDIUM_GAP: 'gap-4',
  LARGE_GAP: 'gap-6',
} as const;

/**
 * Layout patterns
 */
export const LAYOUT = {
  CONTAINER: 'w-full max-w-md mx-auto',
  FULL_HEIGHT: 'min-h-screen',
  CENTER: 'flex items-center justify-center',
  FLEX_COL: 'flex flex-col',
  GRID_2: 'columns-2',
  MASONRY: 'columns-2 gap-4',
} as const;

/**
 * Card styles
 */
export const CARD = {
  BASE: 'bg-[var(--app-card-bg)] rounded-2xl overflow-hidden',
  SHADOW: 'shadow-lg hover:shadow-xl',
  INTERACTIVE: 'cursor-pointer hover:scale-[1.02]',
  FULL: 'bg-[var(--app-card-bg)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer',
} as const;

/**
 * Color classes using CSS variables
 */
export const COLORS = {
  BACKGROUND: 'bg-[var(--app-background)]',
  FOREGROUND: 'text-[var(--app-foreground)]',
  FOREGROUND_MUTED: 'text-[var(--app-foreground-muted)]',
  ACCENT: 'text-[var(--app-accent)]',
  ACCENT_BG: 'bg-[var(--app-accent)]',
  GRAY: 'bg-[var(--app-gray)]',
  CARD_BG: 'bg-[var(--app-card-bg)]',
} as const;

/**
 * Interactive states
 */
export const INTERACTIVE = {
  HOVER_SCALE: 'hover:scale-105',
  HOVER_OPACITY: 'hover:opacity-80',
  ACTIVE_SCALE: 'active:scale-95',
  FOCUS_RING: 'focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2',
  DISABLED: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

/**
 * Text styles
 */
export const TEXT = {
  HEADING_LARGE: 'text-2xl font-bold',
  HEADING_MEDIUM: 'text-xl font-semibold',
  HEADING_SMALL: 'text-lg font-medium',
  BODY: 'text-base',
  SMALL: 'text-sm',
  TINY: 'text-xs',
  CENTER: 'text-center',
  MUTED: 'text-[var(--app-foreground-muted)]',
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  SM: 'sm:',
  MD: 'md:',
  LG: 'lg:',
  XL: 'xl:',
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  DROPDOWN: 'z-10',
  STICKY: 'z-20',
  MODAL: 'z-30',
  OVERLAY: 'z-40',
  TOAST: 'z-50',
} as const;

/**
 * Common component combinations
 */
export const COMPONENTS = {
  LOADING_SPINNER: `${COLORS.ACCENT_BG} rounded-full ${ANIMATIONS.PULSE}`,
  ERROR_MESSAGE: `${TEXT.CENTER} py-8 ${ANIMATIONS.FADE_IN}`,
  MODAL_OVERLAY: `fixed inset-0 ${COLORS.BACKGROUND} bg-opacity-90 ${Z_INDEX.OVERLAY}`,
  PULL_REFRESH: `fixed top-0 left-0 right-0 ${LAYOUT.CENTER} ${COLORS.BACKGROUND} ${Z_INDEX.OVERLAY} ${TRANSITIONS.NORMAL}`,
} as const;

/**
 * Utility function to combine classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Helper function to create responsive classes
 */
export function responsive(base: string, sm?: string, md?: string, lg?: string): string {
  const classes = [base];
  if (sm) classes.push(`${BREAKPOINTS.SM}${sm}`);
  if (md) classes.push(`${BREAKPOINTS.MD}${md}`);
  if (lg) classes.push(`${BREAKPOINTS.LG}${lg}`);
  return classes.join(' ');
}