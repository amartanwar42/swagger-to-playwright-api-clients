/**
 * Auto-generated API Client
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

import { BaseAPIClient, RequestOptions, APIResponseResult } from '../../BaseAPIClient';
import {
	postUserCreateWithArrayRequest,
	postUserCreateWithListRequest,
	getUserByUsernameResponse,
	putUserByUsernameRequest,
	getUserLoginResponse,
	postUserRequest,
} from './types';

/**
 * UserClient - Auto-generated API client
 */
export class UserClient {
	private client: BaseAPIClient;

	constructor(client: BaseAPIClient) {
		this.client = client;
	}

	/**
	 * Creates list of users with given input array
	 * @param data - Request body
	 */
	postUserCreateWithArray = async (
		data: postUserCreateWithArrayRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.post('/user/createWithArray', data, options);
	};

	/**
	 * Creates list of users with given input array
	 * @param data - Request body
	 */
	postUserCreateWithList = async (
		data: postUserCreateWithListRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.post('/user/createWithList', data, options);
	};

	/**
	 * Get user by user name
	 * @param username - The name that needs to be fetched. Use user1 for testing.
	 */
	getUserByUsername = async (
		username: string,
		options?: RequestOptions
	): Promise<APIResponseResult<getUserByUsernameResponse>> => {
		return this.client.get(`/user/${username}`, options);
	};

	/**
	 * Updated user
	 * This can only be done by the logged in user.
	 * @param username - name that need to be updated
	 * @param data - Request body
	 */
	putUserByUsername = async (
		username: string,
		data: putUserByUsernameRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.put(`/user/${username}`, data, options);
	};

	/**
	 * Delete user
	 * This can only be done by the logged in user.
	 * @param username - The name that needs to be deleted
	 */
	deleteUserByUsername = async (
		username: string,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.delete(`/user/${username}`, undefined, options);
	};

	/**
	 * Logs user into the system
	 * @param params - Query parameters
	 */
	getUserLogin = async (
		params: { username: string; password: string },
		options?: RequestOptions
	): Promise<APIResponseResult<getUserLoginResponse>> => {
		const reqOptions = { ...options, params };
		return this.client.get('/user/login', reqOptions);
	};

	/**
	 * Create user
	 * This can only be done by the logged in user.
	 * @param data - Request body
	 */
	postUser = async (
		data: postUserRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.post('/user', data, options);
	};

	/**
	 * Logs out current logged in user session
	 */
	getUserLogout = async (options?: RequestOptions): Promise<APIResponseResult<unknown>> => {
		return this.client.get('/user/logout', options);
	};
}

export default UserClient;
