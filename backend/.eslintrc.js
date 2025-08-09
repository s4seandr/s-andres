module.exports = {
    env: {
        node: true,        // Node.js globale Variablen und Funktionen
        commonjs: true,    // CommonJS (require/module.exports)
        es2021: true       // ES2021 Features
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,   // ES2021
        sourceType: 'script' // CommonJS (nicht ES modules)
    },
    rules: {
        // Optionale Custom Rules
        'no-console': 'off',           // console.log erlauben (für Server-Logging)
        'no-unused-vars': 'warn',      // Ungenutzte Variablen nur warnen
        'prefer-const': 'warn',        // const bevorzugen
        'no-var': 'error'              // var verbieten
    }
};