/**
 * Design System for Tipi App
 * Inspired by: Clash Royale (bold nav), Web3 apps (minimalism), iOS (polish)
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Background layers (darkest to lightest)
  background: {
    primary: '#0A0A0C',      // Main app background
    secondary: '#111114',    // Slightly elevated surfaces
    tertiary: '#1A1A1F',     // Cards, modals
    elevated: '#222228',     // Pressed states, borders
  },

  // Text hierarchy
  text: {
    primary: '#FFFFFF',      // Headlines, important text
    secondary: '#A1A1AA',    // Body text, descriptions
    tertiary: '#71717A',     // Placeholders, hints
    inverse: '#0A0A0C',      // Text on light backgrounds
  },

  // Feature accent colors (vibrant but not overwhelming)
  accent: {
    primary: '#8B5CF6',      // Main brand purple
    primaryMuted: '#7C3AED', // Darker purple for pressed states
    
    // Feature-specific colors
    shopping: '#10B981',     // Emerald green
    expenses: '#F43F5E',     // Rose/coral
    chores: '#06B6D4',       // Cyan
    household: '#F59E0B',    // Amber
  },

  // Semantic colors
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Surface effects
  surface: {
    glass: 'rgba(255, 255, 255, 0.05)',  // Glassmorphism
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.6)',        // Modal overlays
    highlight: 'rgba(139, 92, 246, 0.15)', // Purple glow
  },

  // Gradients (for special elements)
  gradient: {
    primary: ['#8B5CF6', '#6366F1'],      // Purple to indigo
    shopping: ['#10B981', '#059669'],
    expenses: ['#F43F5E', '#E11D48'],
    chores: ['#06B6D4', '#0891B2'],
    card: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families (using system fonts for performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Pre-defined text styles
  styles: {
    // Headlines
    h1: {
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: 0,
      color: colors.text.primary,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0,
      color: colors.text.primary,
    },

    // Body text
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.text.secondary,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      color: colors.text.secondary,
    },

    // Labels & captions
    label: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.3,
      color: colors.text.secondary,
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',
      color: colors.text.tertiary,
    },

    // Special
    button: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  },
};

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  // Base unit: 4px
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Screen padding
  screen: {
    horizontal: 20,
    vertical: 16,
  },

  // Card padding
  card: {
    padding: 16,
    gap: 12,
  },
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,

  // Specific use cases
  card: 16,
  button: 12,
  input: 12,
  chip: 8,
  avatar: 9999,
};

// =============================================================================
// SHADOWS (for depth)
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// =============================================================================
// ANIMATION
// =============================================================================

export const animation = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Spring configs (for react-native-reanimated)
  spring: {
    gentle: {
      damping: 20,
      stiffness: 150,
    },
    bouncy: {
      damping: 12,
      stiffness: 200,
    },
    stiff: {
      damping: 25,
      stiffness: 300,
    },
  },
};

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // Tab bar
  tabBar: {
    height: 80,
    iconSize: 24,
    paddingBottom: 20,
  },

  // Header
  header: {
    height: 56,
  },

  // Common sizes
  avatar: {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },

  // Touch targets (minimum 44pt for accessibility)
  touchTarget: {
    min: 44,
    comfortable: 48,
  },

  // Card dimensions
  card: {
    minHeight: 72,
  },
};

// =============================================================================
// ICON SIZES
// =============================================================================

export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  layout,
  iconSize,
};

export default theme;

