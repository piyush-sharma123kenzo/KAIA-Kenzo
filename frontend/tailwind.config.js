/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F0F11",       // Primary Deep Graphite
          surface: "#16161A",    // Soft neutral dark surface
          light: "#F9FAFB",      // Secondary/Surfaces light mode neutral
          accent: "#4F46E5",     // Cobalt/Slate Indigo Accent
          accentHover: "#4338CA",
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
          }
        }
      },
      fontFamily: {
        sans: [
          '"Amazon Ember"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(15, 15, 17, 0.12), 0 2px 8px -1px rgba(15, 15, 17, 0.08)',
        premiumDark: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
