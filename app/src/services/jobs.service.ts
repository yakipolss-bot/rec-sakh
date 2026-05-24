import apiClient from './api-client';
import { Job } from '../models/jobs/Job';
import { JobsListResponse } from '../models/jobs/JobsListResponse';
import { JobsQueryParams } from '../models/jobs/JobsQueryParams';

function apiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    return (data as { data: T }).data;
  }
  return data as T;
}

class JobsService {
  async getAll(params?: JobsQueryParams): Promise<JobsListResponse> {
    const { data } = await apiClient.get('/jobs', { params });
    const body = data as { data: Job[]; meta: JobsListResponse['meta'] };
    return body as JobsListResponse;
  }

  async getById(id: string): Promise<Job> {
    const { data } = await apiClient.get(`/jobs/${id}`);
    return apiResponse<Job>(data);
  }
}

const jobsService = new JobsService();
export default jobsService;
export { JobsService };
