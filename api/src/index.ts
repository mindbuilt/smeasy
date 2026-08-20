import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import staffAuthRouter from "./routes/staffAuth";
import staffRouter from "./routes/staff";
import shiftsRouter from "./routes/shifts";
import timeoffRouter from "./routes/timeoff";
import swapRouter from "./routes/swap";
import managerRequestsRouter from "./routes/managerRequests";
import staffPortalRouter from "./routes/staffPortal";
import publishRouter from "./routes/publish";
import exportRouter from "./routes/export";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true, service: "smeasy-api" }));

app.use("/auth", authRouter);
app.use("/", staffAuthRouter);          // GET /invite/:token, POST /staff-auth/signup, POST /staff-auth/login
app.use("/staff", staffRouter);
app.use("/shifts", shiftsRouter);
app.use("/timeoff", timeoffRouter);
app.use("/swap", swapRouter);
app.use("/manager", managerRequestsRouter);
app.use("/staff", staffPortalRouter);   // GET /staff/roster, GET /staff/colleagues
app.use("/publish", publishRouter);
app.use("/export", exportRouter);

app.listen(PORT, () => {
  console.log(`Smeasy API running on port ${PORT}`);
});
