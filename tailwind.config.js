/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bloomberg: {
          bg: '#06080e',
          card: '#0c0f17',
          border: '#1b2336',
          text: '#d1d4dc',
          accent: '#00c9a7',
          blue: '#1373e6',
          red: '#ef4444',
          yellow: '#f59e0b',
          gray: '#5d6b82',
          lightText: '#ffffff',
          mutedText: '#8f9cae',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Turn off preflight to prevent CSS reset conflicts with the existing UI!
  }
}
