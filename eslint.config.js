const eslintConfigPrettier = require('eslint-config-prettier');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
	{
		ignores: ['src/**/*.js', 'src/**/*.d.ts'],
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2019,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslint,
		},
		rules: {
			...typescriptEslint.configs.recommended.rules,
			'@typescript-eslint/ban-types': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
		},
	},
	eslintConfigPrettier,
	eslintPluginPrettierRecommended,
];
