export async function sendFinalizationData(dataObject) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataObject)
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}

