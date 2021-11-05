import { isPlainObject } from './util';

function request(url, method, data, headers = {}) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    Object.keys(headers).forEach(name => {
      xhr.setRequestHeader(name, headers[name]);
    });

    xhr.send(data);

    xhr.onload = e => {
      resolve({
        data: e.target.response
      });
    };
  });
}

function normalizeHeaderName(headers, normalizeName) {
  Object.keys(headers).forEach(name => {
    if (name !== normalizeName && name.toLowerCase() === normalizeName.toLowerCase()) {
      headers[normalizeName] = headers[name];
      delete headers[name];
    }
  });
}

function post(url, data, headers = {}) {
  normalizeHeaderName(headers, 'Content-Type');

  if (headers && !headers['Content-Type'] && isPlainObject(data)) {
    headers['Content-Type'] = 'application/json;charset=utf-8';
  }

  if (isPlainObject(data)) {
    data = JSON.stringify(data);
  }

  return request(url, 'post', data, headers);
}

export {
  request,
  post
};
