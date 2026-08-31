/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amz: {
          navyDark: "#0F1720",
          navy: "#131A22",
          navy2: "#232F3E",
          navy3: "#37475A",
          navy3Hover: "#485769",
          orange: "#FF9900",
          yellow: "#FFD814",
          yellowHover: "#F7CA00",
          searchYellow: "#FEBD69",
          searchYellowHover: "#F3A847",
          bgGray: "#EAEDED",
          cardWhite: "#FFFFFF",
          linkBlue: "#007185",
          linkHover: "#C7511F",
          priceRed: "#B12704",
          bodyInk: "#0F1111",
          secText: "#565959",
          star: "#FFA41C",
          borderGray: "#D5D9D9",
          borderLight: "#E7E7E7",
          green: "#007600",
        },
        brand: {
          dark: "#131A22",
          surface: "#232F3E",
          light: "#EAEDED",
          accent: "#FF9900",
          accentHover: "#E68A00",
          gray: {
            50: "#F7FAFA",
            100: "#EAEDED",
            200: "#D5D9D9",
            250: "#D5D9D9",
            300: "#888C8C",
            400: "#565959",
            500: "#565959",
            600: "#333333",
            700: "#232F3E",
            800: "#131A22",
            850: "#0F1720",
            900: "#0F1111",
          }
        }
      },
      fontFamily: {
        sans: [
          '"Amazon Ember"',
          'Arial',
          'sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica'
        ]
      },
      boxShadow: {
        amzCard: '0 2px 5px rgba(213,217,217,0.5)',
        amzCardHover: '0 4px 10px rgba(0,0,0,0.15)',
        premium: '0 2px 5px rgba(213,217,217,0.5)',
        premiumDark: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
