module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: { 
    extend: {
      animation: {
        'fadeIn': 'fade-in 0.3s ease-out',
      }
    } 
  },
  plugins: [],
}