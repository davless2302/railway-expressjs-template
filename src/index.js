import express from "express";
import { PORT } from "./config.js";
import morgan from "morgan";
import cors from "cors";
import { router , imagesRoutes } from "./routes/routes.js";

const app = express();
app.use(express.json());

app.use(morgan("dev"))

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));

// app.use((req, res, next) => {
//   // try it out at http://localhost:3000/?query=hello+world and check the console
//   const start = Date.now();
//   res.on("finish", () => {
//     const responseTime = Date.now() - start;
//     const contentLength = res.get("Content-Length");
//     console.log({
//       method: req.method,
//       url: req.originalUrl,
//       query: req.query,
//       responseTime: `${responseTime} ms`,
//       contentLength: `${contentLength} bytes`,
//       status: res.statusCode,
//     });
//   });
//   // the next function is a callback that tells express to move on to the next middleware or route handler
//   next();
// });
app.use("/", router);
app.use("/public", imagesRoutes);


app.listen(PORT, () => {
  console.log(`Server en el Puerto ${PORT}`);
});
