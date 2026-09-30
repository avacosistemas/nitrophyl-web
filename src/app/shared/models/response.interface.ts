import { TablePageMetadata } from './table-response.model';

export interface IResponse<Data> {
  status: string;
  data: Data;
  error?: string | null;
  ok?: boolean | null;
  page?: TablePageMetadata | null;
}
