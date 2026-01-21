const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
console.log("CLIST_USER:", process.env.CLIST_USER);



const app = express();


app.use(cors());
app.use(express.json());

const contestRoutes = require("./src/routes/contestRoutes");
app.use("/api", contestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 