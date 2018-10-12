import axios, { AxiosResponse } from 'axios';
import request from 'src/utils/http/interface';
import createError from 'src/utils/http/createError';
import { each } from 'lodash';

/**
 * 请求头信息调整
 */
axios.interceptors.request.use(async (config: request.HttpRequestConfig) => {
  if (!config.timeout) {
    config.timeout = 10 * 1000;
  }

  /**
   * 给每个请求新增时间戳
   */
  config.params = Object.assign({ _s: Date.now() }, config.params);

  /**
   * 注入token
   */
  if (config.hasToken !== false) {
    // let token = LoginStore.currentToken;
    // if (!token) {
      // token = await AsyncStorage.getItem('token');
    // }
    // config.headers.Authorization = token;
  }

  if (config.token) {
    config.headers.Authorization = config.token;
  }

  if (config.requestType && config.requestType === 'JSONString') {
    config.headers['Content-Type'] = 'application/json';
  }

  if (config.requestType && config.requestType === 'paramString') {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    config.transformRequest = (data) => {
      let key,
        result = [];
      if (typeof data === 'string') {
        return data;
      }

      for (key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
      }
      return result.join('&');
    }
  }

  if (config.requestType && config.requestType === 'formdata') {
    // TODO
    config.headers['Content-Type'] = 'multipart/form-data';
    config.transformRequest = (data) => {
      if (data instanceof FormData) {
        return data;
      }
      const f = new FormData();
      each(data, (value: any, key: any) => {
        f.append(key, value);
      })
      return f;
    }
  }

  return config;
});

/**
 * 返回结果调整
 */
axios.interceptors.response.use(response => {
  let data = response.data;

  if (data) {

    if (data.success === false) {
      return createError(response);
    }

    if (data.data) {
      data.status = response.status;
      return data;
    }

    return parseResponse(response);
  }

  return createError(response);
}, error => {
  return createError(error.response);
});

export function get<T>(requestURL: string, config?: request.HttpRequestConfig): Promise<request.ParseResult<T>> {
  // @ts-ignore
  return axios.get(requestURL, config);
}

export function post<T>(requestURL: string, params: any, config?: request.HttpRequestConfig): Promise<request.ParseResult<T>> {
  // @ts-ignore
  return axios.post(requestURL, params, config);
}

/**
 * 如果找不到response.data.data，则将返回格式解析为统一格式
 */
function parseResponse<T>(response: AxiosResponse): request.ParseResult<T> {
  const code: number = response.status;
  const success: boolean = true;
  const result: string = response.statusText;
  const status: number = response.status;
  const data = response.data;

  return { code, success, result, data, status };
}

const http = {
  get, post
}

export default http;
