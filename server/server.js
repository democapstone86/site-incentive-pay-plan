import express from "express";
import api from "./api/index.js";
import { connectDB } from "./db/db.js";

const app = express();

app.use(express.json());

await connectDB();

app.use("/api", api);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
