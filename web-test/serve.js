const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve config.js from root directory first
app.get('/config.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'config.js'));
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('TalkBitch React app with Pipecat TTS ready!');
});