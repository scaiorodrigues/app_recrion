/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#F59E0B',
        background: '#FFF8E7',
        card: '#FFFFFF',
        texto: '#1F2937',
        'texto-claro': '#6B7280',
      },
      borderRadius: {
        card: '20px',
        button: '12px',
        input: '10px',
      },
    },
  },
  plugins: [],
};
