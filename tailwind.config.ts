import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e1e2e',
          foreground: '#cdd6f4',
          accent: '#313244',
          border: '#45475a',
          primary: '#89b4fa',
        },
      },
    },
  },
  plugins: [],
}
export default config
