import { Job } from './Job';

export interface JobsListResponse {
  data: Job[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
