const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const contestRoutes = require("./routes/contestRoutes");
app.use("/api", contestRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
