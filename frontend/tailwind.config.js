/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vidyut: {
          blue: '#2563EB',
          green: '#16A34A',
          gray: '#F8FAFC',
        }
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
      }
    },
  },
  plugins: [],
}
