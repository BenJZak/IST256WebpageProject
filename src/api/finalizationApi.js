import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders } from '../auth/session';

export function sendFinalizationData(dataObject) {
  return fetch(API_BASE_URL + '/orders', {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(dataObject)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  });
}
