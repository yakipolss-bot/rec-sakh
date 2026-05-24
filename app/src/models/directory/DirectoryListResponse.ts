import { DirectoryOrg } from './DirectoryOrg';

export interface DirectoryListResponse {
  data: DirectoryOrg[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
