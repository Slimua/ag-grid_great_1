import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'prefer-const': 'warn',
            'no-case-declarations': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
];
