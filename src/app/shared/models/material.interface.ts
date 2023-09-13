import { IResponse } from './response.interface';

export interface IMaterial {
  id?: number;
  nombre?: string;
}

export type IMaterialsResponse = IResponse<IMaterial[]>;
export type IMaterialResponse = IResponse<IMaterial>;
