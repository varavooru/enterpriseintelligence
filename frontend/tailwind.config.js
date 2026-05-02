/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        stripe: {
          purple: '#635BFF',
          'purple-dark': '#0A2540',
          'purple-light': '#7A73FF',
          cyan: '#00D4AA',
          'slate-900': '#0A2540',
          'slate-800': '#425466',
          'slate-700': '#596773',
          'slate-600': '#6B7C93',
          'slate-500': '#8898AA',
          'slate-400': '#A3ACB9',
          'slate-300': '#C1C9D2',
          'slate-200': '#E3E8EE',
          'slate-100': '#F6F9FC',
          'slate-50': '#FAFBFC',
        },
      },
      boxShadow: {
        'stripe-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'stripe': '0 2px 5px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'stripe-md': '0 4px 12px 0 rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'stripe-lg': '0 12px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'stripe': '8px',
      },
    },
  },
  plugins: [],
}
