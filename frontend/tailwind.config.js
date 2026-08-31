/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        rack: {
          bg: '#101216',        // Deep Rack Basalt
          panel: '#181b22',     // Anodized Zinc Faceplate
          border: '#2a303c',    // Chassis Seam & Hairlines
          subtle: '#21262d',    // Sub-panel Rail
          active: '#272f3d',    // Hover / Pressed Metal
        },
        signal: {
          amber: '#ffaa00',     // High-Voltage Filament Amber
          dim: '#c28500',       // Passive Circuit Amber
          glow: 'rgba(255, 170, 0, 0.12)',
        },
        trace: {
          silver: '#e6edf3',    // Laser Etched Readout
          dim: '#8b949e',       // Stamped Metal Labels
          subtle: '#484f58',    // Inactive Circuit Lines
        },
        breaker: {
          red: '#e03131',       // Emergency Circuit Breaker
          glow: 'rgba(224, 49, 49, 0.15)',
        }
      },
      boxShadow: {
        'rack-panel': 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.5)',
        'amber-edge': '0 0 0 1px #ffaa00, 0 0 12px rgba(255, 170, 0, 0.25)',
        'hard': '2px 2px 0px #000000',
        'hard-amber': '2px 2px 0px #ffaa00',
      },
    },
  },
  plugins: [],
}
