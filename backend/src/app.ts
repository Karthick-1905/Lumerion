import express, {Express, Request, Response} from "express";
import cors, {CorsOptions} from "cors";
import morgan from "morgan"
import cookieParser from "cookie-parser"

import auth_router from './routes/authRouter'
import user_router from "./routes/userRoutes";
import AuthProvider from "./middleware/authProvider";
import roadmap_router from "./routes/roadmapRouter";
import { setupSwagger } from "./config/swagger";

const app: Express = express();

const corsOptions: CorsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser())

// Setup Swagger documentation
setupSwagger(app);

app.get("/api/health-check", (req : Request,res : Response) => {
  res.status(200).send({success: true, message : "Server is up and running"});
})

app.use("/api/auth", auth_router);
app.use("/api/user",AuthProvider, user_router);
app.use("/api/roadmap", roadmap_router);

export default app;
