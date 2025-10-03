import { httpClient, ApiResponse } from './api';

export interface OrganizationUser {
  id: number;
  name: string;
  email: string;
  organisation_id: number;
  created_at: string;
  updated_at: string;
}

export const userService = {
  async getOrganizationUsers(): Promise<OrganizationUser[]> {
    const response = await httpClient.get<OrganizationUser[]>('/organisation/users');
    return response.data || [];
  },
};
