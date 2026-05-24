export interface JobsQueryParams {
  page?: number;
  perPage?: number;
  type?: string;
  categoryId?: string;
  city?: string;
  search?: string;
  schedule?: string;
  salaryMin?: string;
  salaryMax?: string;
  sort?: string;
}
