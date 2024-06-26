import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// to allow json data
app.use(express.json({ limit: "16kb" }));

// to make url same at all places
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// import routes

import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", courseRoutes);

export { app };
