const express = require('express');
const cors = require('cors');
const personnelRoutes = require('./routes/personnelRoutes');
const pdksRoutes = require('./routes/pdksRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/personnel', personnelRoutes);
app.use('/api/pdks', pdksRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});