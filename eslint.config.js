import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    // Build output, fetched dependencies and vendored source trees.
    //
    // `native/` is Zig-fetched third-party C/JS (tree-sitter grammars, dawn,
    // freetype) and is gitignored. Its grammar.js files are written in the
    // tree-sitter DSL, where `seq`, `choice`, `field`, `prec`, `alias`, etc.
    // are ambient grammar-builder globals — linting them as browser JS
    // produced ~7,900 bogus `no-undef` errors.
    // `**/node_modules/` is needed because ESLint only auto-ignores the
    // top-level one; lsp-service has its own.
    ignores: [
      'dist',
      'dist-ssr',
      '**/node_modules/',
      'native/',
      'src/wasm/target/',
    ],
  },
  {
    // Browser app: everything under src/ (JSX, Vite, workers).
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Web Workers / SharedWorker / ServiceWorker, used by the hand tracking
        // and scanner workers under src/workers/.
        ...globals.worker,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off', // disable prop-types rule
      'react/no-unknown-property': 'off', // disable unknown-property checks
      'react/display-name': 'off', // anonymous exports are fine
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    // Express API, Socket.IO handlers and worker services: plain Node ESM.
    files: ['backend/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    // Node tooling: one-off analysis/test scripts in scripts/ and the standalone
    // language-server service in lsp-service/. Previously these fell through to
    // the browser block above, so `process`, `require` and `__dirname` were
    // reported as undefined.
    files: ['scripts/**/*.{js,mjs,cjs}', 'lsp-service/**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    // Playwright repro harnesses. The files themselves are Node (they launch a
    // browser through process.env.PW_PATH), but every `ctx.addInitScript()`
    // callback is stringified and evaluated *inside the page*, so references to
    // localStorage, window, document and HTMLCanvasElement are genuine there.
    // They therefore need the browser globals on top of the Node set above.
    files: ['scripts/repro-*.mjs'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Build config itself.
    files: ['*.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];