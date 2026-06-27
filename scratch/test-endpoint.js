fetch('https://uperai.in/api/test-db?cb=' + Date.now())
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
