// Typography system using Poppins font family

export const typography = {
  // Font families
  fontFamily: {
    primary: '"Poppins", sans-serif',
    secondary: '"Inter", sans-serif',
    mono: '"Fira Code", monospace',
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  
  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text styles
  h1: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '3rem',      // 48px
    fontWeight: 700,
    lineHeight: '1.2',
    letterSpacing: '-0.025em',
  },
  
  h2: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '2.25rem',   // 36px
    fontWeight: 700,
    lineHeight: '1.3',
    letterSpacing: '-0.025em',
  },
  
  h3: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1.875rem',  // 30px
    fontWeight: 600,
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  
  h4: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1.5rem',    // 24px
    fontWeight: 600,
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  
  h5: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1.25rem',   // 20px
    fontWeight: 600,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  h6: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1rem',      // 16px
    fontWeight: 600,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  body1: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  body2: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  subtitle1: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '1rem',      // 16px
    fontWeight: 500,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  subtitle2: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  button: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    lineHeight: '1.5',
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
  },
  
  caption: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '0.75rem',   // 12px
    fontWeight: 400,
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  overline: {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '0.75rem',   // 12px
    fontWeight: 600,
    lineHeight: '1.5',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
};

export type Typography = typeof typography;
