fetch('https://uperai.in/api/stats?cb=' + Date.now())
  .then(res => res.json())
  .then(console.log);
