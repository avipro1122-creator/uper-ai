fetch('https://uperai.in/api/stats')
  .then(res => res.json())
  .then(data => console.log("LIVE API STATS RESPONSE:", data))
  .catch(err => console.error("LIVE API STATS ERROR:", err));
