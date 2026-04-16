/**
 * Auto-generated API Client
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

import { BaseAPIClient, RequestOptions, APIResponseResult } from '../../BaseAPIClient';
import {
	postPetUploadImageByPetIdResponse,
	postPetRequest,
	putPetRequest,
	getPetFindByStatusResponse,
	getPetFindByTagsResponse,
	getPetByPetIdResponse,
} from './types';

/**
 * PetClient - Auto-generated API client
 */
export class PetClient {
	private client: BaseAPIClient;

	constructor(client: BaseAPIClient) {
		this.client = client;
	}

	/**
	 * uploads an image
	 * @param petId - ID of pet to update
	 */
	postPetUploadImageByPetId = async (
		petId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<postPetUploadImageByPetIdResponse>> => {
		return this.client.post(`/pet/${petId}/uploadImage`, {}, options);
	};

	/**
	 * Add a new pet to the store
	 * @param data - Request body
	 */
	postPet = async (
		data: postPetRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.post('/pet', data, options);
	};

	/**
	 * Update an existing pet
	 * @param data - Request body
	 */
	putPet = async (
		data: putPetRequest,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.put('/pet', data, options);
	};

	/**
	 * Finds Pets by status
	 * Multiple status values can be provided with comma separated strings
	 * @param params - Query parameters
	 */
	getPetFindByStatus = async (
		params: { status: string[] },
		options?: RequestOptions
	): Promise<APIResponseResult<getPetFindByStatusResponse>> => {
		const reqOptions = { ...options, params };
		return this.client.get('/pet/findByStatus', reqOptions);
	};

	/**
	 * Finds Pets by tags
	 * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
	 * @deprecated
	 * @param params - Query parameters
	 */
	getPetFindByTags = async (
		params: { tags: string[] },
		options?: RequestOptions
	): Promise<APIResponseResult<getPetFindByTagsResponse>> => {
		const reqOptions = { ...options, params };
		return this.client.get('/pet/findByTags', reqOptions);
	};

	/**
	 * Find pet by ID
	 * Returns a single pet
	 * @param petId - ID of pet to return
	 */
	getPetByPetId = async (
		petId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<getPetByPetIdResponse>> => {
		return this.client.get(`/pet/${petId}`, options);
	};

	/**
	 * Updates a pet in the store with form data
	 * @param petId - ID of pet that needs to be updated
	 */
	postPetByPetId = async (
		petId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.post(`/pet/${petId}`, {}, options);
	};

	/**
	 * Deletes a pet
	 * @param petId - Pet id to delete
	 */
	deletePetByPetId = async (
		petId: number,
		options?: RequestOptions
	): Promise<APIResponseResult<unknown>> => {
		return this.client.delete(`/pet/${petId}`, undefined, options);
	};
}

export default PetClient;
