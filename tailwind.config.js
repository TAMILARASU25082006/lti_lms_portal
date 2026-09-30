/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#e1e9f2',
          200: '#c3d3e6',
          300: '#95b3d4',
          400: '#618ec0',
          500: '#3d6ea8',
          600: '#2d5489',
          700: '#25446f',
          800: '#1e385c',
          900: '#0f2744',
          950: '#0a192f',
        },
        brand: {
          blue: '#1d4ed8',
          lightBlue: '#3b82f6',
          sky: '#0284c7',
          navy: '#0f2744',
          navyDark: '#0a192f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
