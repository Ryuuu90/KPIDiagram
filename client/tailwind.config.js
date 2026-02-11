module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        finance: {
          primary: '#FF5722',   // Primary Orange
          secondary: '#FF9800', // Secondary Orange
          accent: '#FB923C',    // Orange 400
          success: '#10B981',   // Emerald 500 (Kept for status)
          warning: '#F59E0B',   // Amber 500 (Kept for status)
          danger: '#EF4444',    // Red 500 (Kept for status)
          surface: '#FFFBF5',   // Very light orange/cream
          card: 'rgba(255, 255, 255, 0.8)',
          light: '#FFF7ED',     // Lightest orange
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
