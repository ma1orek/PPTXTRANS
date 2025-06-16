// TAILWIND V4 POSTCSS CONFIG - Netlify Compatible
// Fixed for Tailwind CSS v4.0 with proper PostCSS plugin

export default {
  plugins: {
    // IMPORTANT: For Tailwind v4, we need @tailwindcss/postcss instead of 'tailwindcss'
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}