const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/three', (req, res) => {
  setTimeout(() => {
    res.send('Took 3 seconds to load');
  }, 3000);
});

app.get('/ten', (req, res) => {
  setTimeout(() => {
    res.send('Took 10 seconds to load');
  }, 10000);
});

app.listen(8180).setTimeout(1000); // Start server and listen on port 8180
