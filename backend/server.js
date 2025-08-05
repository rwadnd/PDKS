const express = require("express");
const cors = require("cors");
const personnelRoutes = require("./routes/personnelRoutes");
const pdksRoutes = require("./routes/pdksRoutes");
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/personnel", personnelRoutes);
app.use("/api/pdks", pdksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/department", departmentRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
