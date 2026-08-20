import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import staffRouter from "./routes/staff";
import shiftsRouter from "./routes/shifts";
import timeoffRouter from "./routes/timeoff";
import publishRouter from "./routes/publish";
import exportRouter from "./routes/export";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true, service: "smeasy-api" }));

app.use("/auth", authRouter);
app.use("/staff", staffRouter);
app.use("/shifts", shiftsRouter);
app.use("/timeoff", timeoffRouter);
app.use("/publish", publishRouter);
app.use("/export", exportRouter);

app.listen(PORT, () => {
  console.log(`Smeasy API running on port ${PORT}`);
});
