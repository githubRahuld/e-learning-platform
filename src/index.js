import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";

const PORT = process.env.PORT;

dotenv.config({ path: "/env" });

connectDB()
  .then(() => {
    app.listen(PORT || 8000, () => {
      console.log(`⚙️ Server is listening on PORT: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !! ", err);
  });
