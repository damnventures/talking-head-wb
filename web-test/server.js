const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('dist'));

// API proxy for Argue endpoint
app.post('/api/argue', (req, res) => {
  try {
    console.log('Proxying Argue API request:', req.body);

    const postData = JSON.stringify(req.body);

    const options = {
      hostname: 'craig.shrinked.ai',
      port: 443,
      path: '/api/argue',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer sk_467ce0191eb13f0d807736e149ae75a9f23212d07439ff01'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Argue API success:', jsonData);
          res.status(proxyRes.statusCode).json(jsonData);
        } catch (parseError) {
          console.error('Failed to parse Argue API response:', parseError);
          res.status(500).json({ error: 'Invalid response from Craig API' });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Argue API proxy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    proxyReq.write(postData);
    proxyReq.end();

  } catch (error) {
    console.error('Argue API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New API proxy for Capsule Context endpoint
app.get('/api/capsule-context/:capsuleId', (req, res) => {
  try {
    const capsuleId = req.params.capsuleId;
    console.log(`Proxying Capsule Context API request for capsuleId: ${capsuleId}`);

    const options = {
      hostname: 'api.shrinked.ai',
      port: 443,
      path: `/capsules/${capsuleId}/context`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer sk_467ce0191eb13f0d807736e149ae75a9f23212d07439ff01' // Use the same API key as Argue
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Capsule Context API success:', jsonData);
          res.status(proxyRes.statusCode).json(jsonData);
        } catch (parseError) {
          console.error('Failed to parse Capsule Context API response:', parseError);
          res.status(500).json({ error: 'Invalid response from Capsule Context API' });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Capsule Context API proxy error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    proxyReq.end();

  } catch (error) {
    console.error('Capsule Context API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('API proxy available at /api/argue');
});