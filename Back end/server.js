const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Sadə test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'AiryPhone backend is working ✅' });
});

app.listen(PORT, () => {
  console.log(`AiryPhone backend http://localhost:${PORT} ünvanında işləyir`);
});