/**
 * Auto-generated API Client
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

import { BaseAPIClient, RequestOptions, APIResponseResult } from '../../BaseAPIClient';
import {
	getStoreInventoryResponse,
	postStoreOrderRequest,
	postStoreOrderResponse,
	getStoreOrderByOrderIdResponse,
} from './types';

/**
 * StoreClient - Auto-generated API client
 */
export class StoreClient {
	private client: BaseAPIClient;

	constructor(client: BaseAPIClient) {
		this.client = client;
	}

	/**
	 * Returns pet inventories by status
	 * Returns a map of status codes to quantities
	 */
	getStoreInventory = async (
		options?: RequestOptions
	): Promise<APIResponseResult<getStoreInventoryResponse>> => {
		return this.client.get('/store/inventory', options);
	};

	/**
	 * Place an order for a pet
	 * @param data - Request body
	 */
	postStoreOrder = async (
		data: postStoreOrderRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<postStoreOrderResponse>> => {
		return this.client.post('/store/order', data, options);
	};

	/**
	 * Find purchase order by ID
	 * For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
	 * @param orderId - ID of pet that needs to be fetched
	 */
	getStoreOrderByOrderId = async (
		orderId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<getStoreOrderByOrderIdResponse>> => {
		return this.client.get(`/store/order/${orderId}`, options);
	};

	/**
	 * Delete purchase order by ID
	 * For valid response try integer IDs with positive integer value. Negative or non-integer values will generate API errors
	 * @param orderId - ID of the order that needs to be deleted
	 */
	deleteStoreOrderByOrderId = async (
		orderId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.delete(`/store/order/${orderId}`, undefined, options);
	};
}

export default StoreClient;
