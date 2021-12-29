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

app.get('/five', (req, res) => {
  setTimeout(() => {
    res.send('Took 5 seconds to load');
  }, 5000);
});

// Start server and listen on port 8180
const server = app.listen(8180);

/**
 * Attempt 1
 *
 * Refer to the docs at
 * https://nodejs.org/api/http.html#serversettimeoutmsecs-callback.
 *
 * When we just set a timeout of 1s, it looks like the page loads successfully
 * with a 200, but there's no content returned.  I can't tell if express
 * automatically closes the socket for us? If you load, for example, the /three
 * endpoint, you'll see that the page doe not load the normal text. There's an
 * `ERR_EMPTY_RESPONSE` error page shown in Chrome instead. And the page load
 * takes 2 seconds for some reason.
 *
 * This might be a bad thing to use though because multiple requests might be
 * sent over one socket.
 */
// server.setTimeout(1000);

/**
 * Attempt 2
 *
 * When we set a timeout with a callback, we have to handle the timeout
 * manually. The log message here is run but the page loads normally. This
 * essentially is like logging that the request took a long time but not
 * affecting the request at all.
 *
 * This might be a bad thing to use though because multiple requests might be
 * sent over one socket.
 */
// server.setTimeout(1000, (socket) => {
//   console.info('Timed out, but will still finish loading page');
// });

/**
 * Attempt 3
 *
 * We need to manually destroy the socket if we want to cancel the request. From
 * the client side, the request is failed but it has no HTTP status associated
 * with it. This abruptly kills the request, but doesn't do it nicely.
 *
 * This might be a bad thing to use though because multiple requests might be
 * sent over one socket.
 */
// server.setTimeout(1000, (socket) => {
//   console.info('Destroying socket...');
//   socket.destroy();
// });

/** Attempt 4
 *
 * Let's set up the timeout in the endpoint itself. This should let us respond
 * with a better status code and then destroy the socket once we're done, right?
 * But what's the difference between the request.setTimeout and the response.setTimeout?
 * The request is a stream.Readable that is created separately from its
 * underlying socket since a socket may be reused in terms of keep-alive. See
 * docs at https://nodejs.org/api/http.html#class-httpincomingmessage.
 */
app.get('/two', (req, res) => {
  setTimeout(() => {
    res.send('Took 2 seconds to load');
  }, 2000);
  req.setTimeout(500, () => {
    // const LOOP_DETECTED = 508;
    // res.sendStatus(LOOP_DETECTED);
    // res.send('Our bad!');
    // This does not seem to get called because we aren't sending a large amount of data??
    console.info('Request timed out...');
  });
  res.setTimeout(500, () => {
    // This does get called.
    console.info('Response timed out...');
  });
});

/**
 * Attempt 5
 *
 * Here we set up a post endpoint where we want to log when the data sent from
 * the client took a long time, but also the response from the server took a
 * long time. Here we see both log messages.
 */
app.post('/data1', (req, res) => {
  console.info('/data1');

  setTimeout(() => {
    // WHen tunneling through ngrok, this doesn't work properly?!
    res.status(201).send('Took 2 seconds to send our response.');
  }, 2000);
  req.setTimeout(500, () => {
    // This does get called.
    console.info('Request timed out...');
  });
  res.setTimeout(500, () => {
    // This does get called.
    console.info('Response timed out...');
  });
});

/**
 * Attempt 6
 *
 * We are still receiving some data from the client, but we don't wait for that
 * data. We send a response immediately.
 */
app.post('/data2', (req, res) => {
  console.info('/data2');

  req.setTimeout(500, () => {
    // This does not get called.
    console.info('Request timed out...');
  });
  res.setTimeout(500, () => {
    // This does not get called.
    console.info('Response timed out...');
  });

  res.send('Sent our response immediately.');
});

/**
 * Attempt 7
 *
 * We receive our data from the client, and we require that to be received
 * before we send a response. Upload takes a few seconds but the response is
 * immediate.
 */
app.post('/data3', (req, res) => {
  console.info('/data3');

  req.setTimeout(500, () => {
    // This does not get called for some reason...
    console.info('Request timed out...');
  });
  req.on('data', (data) => {
    // Needed for the upload to work.
   });
  req.on('end', () => {
    console.info("Upload ended.");
    res.status(201).send('Received the file!');
  });

  res.setTimeout(500, () => {
    // This does not get called...
    console.info('Response timed out...');
  });
});

/**
 * Attempt 8
 *
 * We receive our data from the client, and we require that to be received
 * before we send a response. Upload takes a few seconds and then the response
 * takes a couple seconds after the upload is done.
 */
app.post('/data4', (req, res) => {
  console.info('/data4');

  req.setTimeout(1, () => {
    // This does not get called for some reason...
    console.info('Request timed out...');
  });
  req.on('data', (data) => {
    // Needed for the upload to work.
   });
  req.on('end', () => {
    console.info("Upload ended.");
    setTimeout(() => {
      res.status(201).send('Received the file!');
    }, 2000)
  });

  res.setTimeout(500, () => {
    // This does get called.
    console.info('Response timed out...');
  });
});