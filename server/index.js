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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json({ limit: "50mb" }))

app.use("/api/auth", authRoutes)
app.use("/api/assets", assetRoutes)
app.use("/api/trash", trashRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/locations", locationRoutes)
app.use("/api/backup", backupRoutes)

const distPath = process.env.DIST_DIR || path.join(__dirname, "dist")
app.use(express.static(distPath))
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"))
  }
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AssetPulse server running on http://0.0.0.0:${PORT}`)
})
