process.env.VERCEL = "true"
process.env.DATA_DIR = "/tmp/assetpulse-data"

import serverless from "serverless-http"
import app from "../server/index.js"

const handler = serverless(app)

export default handler
