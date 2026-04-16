/**
 * Auto-generated Playwright fixtures for API clients
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

import { test as base } from '@playwright/test';
import { BaseAPIClient } from './BaseAPIClient';
import { PetClient } from './generatedClients/Pet/PetClient';
import { StoreClient } from './generatedClients/Store/StoreClient';
import { UserClient } from './generatedClients/User/UserClient';

type APIFixtures = {
	baseAPIClient: BaseAPIClient;
	petClient: PetClient;
	storeClient: StoreClient;
	userClient: UserClient;
};

export const test = base.extend<APIFixtures>({
	baseAPIClient: async ({}, use) => {
		const client = new BaseAPIClient(process.env.BASE_URL || 'http://localhost:3000', {});
		await client.init();
		await use(client);
		await client.dispose();
	},

	petClient: async ({ baseAPIClient }, use) => {
		await use(new PetClient(baseAPIClient));
	},

	storeClient: async ({ baseAPIClient }, use) => {
		await use(new StoreClient(baseAPIClient));
	},

	userClient: async ({ baseAPIClient }, use) => {
		await use(new UserClient(baseAPIClient));
	},
});

export { expect } from '@playwright/test';
