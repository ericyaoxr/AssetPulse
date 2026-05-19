import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js"
import assetRoutes from "./routes/assets.js"
import trashRoutes from "./routes/trash.js"
import categoryRoutes from "./routes/categories.js"
import locationRoutes from "./routes/locations.js"
import backupRoutes from "./routes/backup.js"
import settingsRoutes from "./routes/settings.js"
import aiRoutes from "./routes/ai.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8642

const app = express()

const corsOrigin = process.env.CORS_ORIGIN || ""
const corsOptions = corsOrigin
  ? { origin: corsOrigin.split(",").map(s => s.trim()), credentials: true }
  : { origin: true, credentials: true }
app.use(cors(corsOptions))

app.use(express.json({ limit: "10mb" }))

try {
  const helmet = (await import("helmet")).default
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }))
} catch {
  // helmet not installed, skip
}

try {
  const { default: rateLimit } = await import("express-rate-limit")
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" },
  })
  app.use("/api/auth/login", authLimiter)
  app.use("/api/auth/register", authLimiter)
} catch {
  // express-rate-limit not installed, skip
}

app.use("/api/auth", authRoutes)
app.use("/api/assets", assetRoutes)
app.use("/api/trash", trashRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/locations", locationRoutes)
app.use("/api/backup", backupRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/ai", aiRoutes)

const distPath = process.env.DIST_DIR || path.join(__dirname, "..", "dist")
app.use(express.static(distPath))
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"))
  }
})

if (!process.env.NETLIFY) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AssetPulse server running on http://0.0.0.0:${PORT}`)
  })
}

export default app
