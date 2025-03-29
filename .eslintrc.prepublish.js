module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
		ecmaVersion: 2021,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'prettier'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:prettier/recommended',
	],
	env: {
		node: true,
		es2021: true,
	},
	rules: {
		// Enforce stricter rules for publishing
		'@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }], // Error on unused vars
		'@typescript-eslint/explicit-module-boundary-types': 'error', // Require explicit return types
		'@typescript-eslint/consistent-type-imports': 'error',
		'@typescript-eslint/no-var-requires': 'error', // Disallow require
		'@typescript-eslint/no-explicit-any': 'error', // Disallow 'any' type
		'@typescript-eslint/no-non-null-assertion': 'error', // Disallow non-null assertions '!'
		'no-console': 'error', // Disallow console logs
		'no-debugger': 'error', // Disallow debugger statements
	},
	ignorePatterns: ['dist/', 'node_modules/', 'gulpfile.js', '.eslintrc.js', '.eslintrc.prepublish.js', '.prettierrc.js'],
};
