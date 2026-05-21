import path from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, "..", ".env") })

const { default: server } = await import("./index.js")
