import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './src/tests',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		trace: 'on-first-retry',
	},
});
