export interface IResponse<Data> {
  status: string;
  data: Data;
  error : string;
}
