module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
		ecmaVersion: 2021, // Align with tsconfig target
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'prettier'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	env: {
		node: true,
		es2021: true,
	},
	rules: {
		// Add specific rule overrides here if needed
		// Example: Allow unused variables starting with _
		'@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
		// Example: Relax requirement for explicit return types on functions
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		// Enforce consistent import types
		'@typescript-eslint/consistent-type-imports': 'warn',
		// Allow require statements (needed for CommonJS modules)
		'@typescript-eslint/no-var-requires': 'off',
		// Allow any types where necessary, but prefer specific types
		'@typescript-eslint/no-explicit-any': 'warn',
		// Allow non-null assertions (use with caution)
		'@typescript-eslint/no-non-null-assertion': 'warn',
	},
	ignorePatterns: ['dist/', 'node_modules/', 'gulpfile.js', '.eslintrc.js', '.eslintrc.prepublish.js', '.prettierrc.js'],
};
