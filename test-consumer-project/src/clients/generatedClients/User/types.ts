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

export interface postUserCreateWithArrayRequest {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}
[];

export type postUserCreateWithArrayResponse = any;

export interface postUserCreateWithListRequest {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}
[];

export type postUserCreateWithListResponse = any;

export interface getUserByUsernameResponse {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}

export interface putUserByUsernameRequest {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}

export type putUserByUsernameResponse = any;

export type deleteUserByUsernameResponse = any;

export type getUserLoginResponse = string;

export interface postUserRequest {
	id?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
	phone?: string;
	userStatus?: number;
}

export type postUserResponse = any;

export type getUserLogoutResponse = any;
