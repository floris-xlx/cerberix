import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        hover: 'var(--color-hover)',
        brand: 'var(--color-brand)'
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.375rem'
      },
      boxShadow: {
        none: 'none'
      }
    }
  },
  plugins: []
} satisfies Config;


