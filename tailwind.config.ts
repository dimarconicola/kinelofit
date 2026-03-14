import { heroui } from '@heroui/react';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            default: {
              50: '#f9f8f6',
              100: '#f1efe9',
              200: '#e6e4dd',
              300: '#d6d3ca',
              400: '#b8b6ac',
              500: '#8f8c84',
              600: '#6f6c65',
              700: '#56534e',
              800: '#3a3835',
              900: '#22211f',
              foreground: '#2c302e',
              DEFAULT: '#f1efe9'
            },
            primary: {
              50: '#eff5ee',
              100: '#d4dfd0',
              200: '#bdcdb9',
              300: '#a0b49d',
              400: '#7f957f',
              500: '#5e7462',
              600: '#4a5d4e',
              700: '#3f4f43',
              800: '#354139',
              900: '#2c302e',
              foreground: '#ffffff',
              DEFAULT: '#4a5d4e'
            },
            secondary: {
              50: '#f9f5ec',
              100: '#f0e8d7',
              200: '#e8dcc4',
              300: '#ddccaa',
              400: '#d0bc92',
              500: '#bca37a',
              600: '#a18761',
              700: '#7f6949',
              800: '#5e4d35',
              900: '#463926',
              foreground: '#2c302e',
              DEFAULT: '#e8dcc4'
            },
            success: {
              50: '#edf7f2',
              100: '#d3e7db',
              200: '#b6d7c4',
              300: '#90c1a5',
              400: '#6aa987',
              500: '#4f8f6e',
              600: '#3d7358',
              700: '#305944',
              800: '#244032',
              900: '#1c3025',
              foreground: '#ffffff',
              DEFAULT: '#4f8f6e'
            },
            danger: {
              50: '#fff3ef',
              100: '#ffd8cb',
              200: '#ffbea8',
              300: '#ff9e7f',
              400: '#f78161',
              500: '#e36443',
              600: '#bc4f32',
              700: '#943d26',
              800: '#6f2d1c',
              900: '#502014',
              foreground: '#ffffff',
              DEFAULT: '#e36443'
            }
          }
        }
      }
    })
  ]
};

export default config;
