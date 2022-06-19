const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/static"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`App is listening on port http://localhost:${port}`);
});
