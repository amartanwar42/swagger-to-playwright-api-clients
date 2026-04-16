/**
 * Auto-generated TypeScript types
 * DO NOT EDIT - This file is generated from Swagger/OpenAPI specification
 */

export interface ApiResponse {
	code?: number;
	type?: string;
	message?: string;
}

export interface Category {
	id?: number;
	name?: string;
}

export interface Pet {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}

export interface Tag {
	id?: number;
	name?: string;
}

export interface Order {
	id?: number;
	petId?: number;
	quantity?: number;
	shipDate?: string;
	status?: 'placed' | 'approved' | 'delivered';
	complete?: boolean;
}

export interface User {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}

export interface postPetUploadImageByPetIdResponse {
	code?: number;
	type?: string;
	message?: string;
}

export interface postPetRequest {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}

export type postPetResponse = any;

export interface putPetRequest {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}

export type putPetResponse = any;

export interface getPetFindByStatusResponse {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}
[];

export interface getPetFindByTagsResponse {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}
[];

export interface getPetByPetIdResponse {
	id?: number;
	category?: Category;
	name: string;
	photoUrls: string[];
	tags?: Tag[];
	status?: 'available' | 'pending' | 'sold';
}

export type postPetByPetIdResponse = any;

export type deletePetByPetIdResponse = any;
