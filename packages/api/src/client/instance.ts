import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { BaseResponse } from '@/types';

let accessToken: string | null = null;
let refreshTokenPromise: Promise<string> | null = null;

/**
 * Set the access token.
 * @param token The access token.
 */
const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/**
 * Clear the access token.
 */
const clearAccessToken = () => {
  accessToken = null;
};

const apiInstance = axios.create({
  baseURL: 'http://localhost:/api',
  timeout: 10000,
  withCredentials: true,
});

apiInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    config.headers['X-Request-ID'] = crypto.randomUUID(); // natively supported by the browser
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiInstance.interceptors.response.use(
  (response: AxiosResponse<BaseResponse<any>>) => {
    if (response.data.status === 0) {
      return response;
    }
    return Promise.reject(new Error(response.data.msg));
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshTokenPromise) {
        refreshTokenPromise = apiInstance
          .post('/auth/refresh')
          .then(({ data }) => {
            setAccessToken(data.accessToken);
            refreshTokenPromise = null;
            return data.accessToken;
          })
          .catch((refreshError) => {
            refreshTokenPromise = null;
            clearAccessToken();
            // In a browser environment
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          });
      }

      return refreshTokenPromise.then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
        }
        return apiInstance(originalRequest);
      });
    }

    return Promise.reject(error);
  },
);

export { apiInstance, setAccessToken, clearAccessToken };
