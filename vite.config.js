import { defineConfig } from 'vite'

export default defineConfig({
  base: '/D-C_TorresDeHanoi/',
  root: './src',
  build: {
    outDir: '../dist',
  },
  alias: {
    'orbit': '/node_modules/three/examples/jsm/controls/OrbitControls.js',
    'three': '/node_modules/three/build/three.module.js'
  }
})
