export function sendFinalizationData(dataObject) {
  return fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataObject)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  });
}
