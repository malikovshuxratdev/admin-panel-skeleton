/**
 * The single axios instance. Every request in the application goes through it.
 *
 * Rules:
 *   - Only `features/<d>/api/` modules may import this. A component or hook
 *     that imports `baseApiClient` directly has skipped a layer.
 *   - Auth token attachment, refresh-on-401 and error normalisation live here
 *     so no feature has to repeat them.
 *   - CAUTION: an endpoint that answers HTTP 200 with an error in the body
 *     never reaches this interceptor. The feature's api/ module must detect
 *     that case and reject explicitly.
 */
import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { BASE_URI } from "@/shared/constants";

export class HTTPError extends Error {
  constructor(
    public status: number,
    public cause: string,
  ) {
    super(cause);
  }
}

export class BaseClient {
  private axios: AxiosInstance;
  private static instance: BaseClient | null = null;

  private constructor() {
    this.axios = Axios.create({ baseURL: BASE_URI });
    this.axios.interceptors.response.use((r: AxiosResponse) => r, this.onApiError);
  }

  public static getInstance(): BaseClient {
    if (!BaseClient.instance) BaseClient.instance = new BaseClient();
    return BaseClient.instance;
  }

  private onApiError = async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as { message?: string } | undefined;
    if (!error.response) return Promise.reject(new HTTPError(0, "Network error"));
    return Promise.reject(new HTTPError(status, body?.message ?? error.message));
  };

  get = async <T, K, C>(url: string, params?: K, config?: AxiosRequestConfig<C>) =>
    this.axios.get<T>(url, { ...config, params });

  post = async <T, K>(url: string, data?: K) => this.axios.post<T>(url, data);
  put = async <T, K>(url: string, data?: K) => this.axios.put<T>(url, data);
  delete = async <T, K>(url: string, data?: K) => this.axios.delete<T>(url, { params: data });
}

export const baseApiClient = BaseClient.getInstance();
