/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Light mode
        background: '#F0F7FF',
        surface: '#FFFFFF',
        primary: '#2B9EE8',
        'text-primary': '#0F1E2E',
        'text-muted': '#7A9BB5',
        border: '#D0E8FA',
        success: '#16A34A',
        // Dark mode
        'dark-background': '#0B1622',
        'dark-surface': '#172232',
        'dark-primary': '#3AAFFF',
        'dark-text-primary': '#E8F4FF',
        'dark-text-muted': '#4D7898',
        'dark-border': '#1E3147',
      },
    },
  },
  plugins: [],
};
