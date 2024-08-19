"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _vite = require("vite");

var _vitePluginTopLevelAwait = _interopRequireDefault(require("vite-plugin-top-level-await"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = (0, _vite.defineConfig)({
  base: '/D-C_TorresDeHanoi/',
  root: './src',
  build: {
    outDir: '../dist'
  },
  alias: {
    'orbit': '/node_modules/three/examples/jsm/controls/OrbitControls.js',
    'three': '/node_modules/three/build/three.module.js'
  },
  esbuild: {
    target: 'esnext' // Configura o ambiente para o mais recente suporte

  },
  plugins: [(0, _vitePluginTopLevelAwait["default"])()]
});

exports["default"] = _default;