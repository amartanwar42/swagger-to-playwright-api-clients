import { test, expect } from '@playwright/test';
import { BaseAPIClient } from '../clients/BaseAPIClient';

// Using Beeceptor's sample API for testing
// https://beeceptor.com/docs/sample-api-for-testing/
const BASE_URL = 'https://echo.free.beeceptor.com';

// Run tests serially to avoid rate limiting
test.describe.configure({ mode: 'serial' });

test.describe('BaseAPIClient', () => {
	let client: BaseAPIClient;

	test.beforeAll(async () => {
		client = new BaseAPIClient(BASE_URL, {
			'Content-Type': 'application/json',
		});
		await client.init();
	});

	test.afterAll(async () => {
		await client.dispose();
	});

	test('GET request should return successful response', async () => {
		const { body, status } = await client.get('/sample-request');

		expect(status).toBe(200);
		expect(body).toBeDefined();
	});

	test('POST request should return successful response', async () => {
		const payload = {
			name: 'Test User',
			email: 'test@example.com',
		};

		const { body, status } = await client.post('/sample-request', payload);

		expect(status).toBe(200);
		expect(body).toBeDefined();
	});

	test('PUT request should return successful response', async () => {
		const payload = {
			id: 1,
			name: 'Updated User',
			email: 'updated@example.com',
		};

		const { body, status } = await client.put('/sample-request', payload);

		expect(status).toBe(200);
		expect(body).toBeDefined();
	});

	test('PATCH request should return successful response', async () => {
		const payload = {
			name: 'Patched Name',
		};

		const { body, status } = await client.patch('/sample-request', payload);

		expect(status).toBe(200);
		expect(body).toBeDefined();
	});

	test('DELETE request should return successful response', async () => {
		const { body, status } = await client.delete('/sample-request');

		expect(status).toBe(200);
		expect(body).toBeDefined();
	});
});
