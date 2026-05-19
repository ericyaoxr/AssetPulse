import serverless from "serverless-http"
import app from "../server/index.js"

// 设置环境变量以确保在Vercel上正确运行
process.env.NETLIFY = "false"
process.env.VERCEL = "true"

// 确保数据目录在Vercel的临时存储中
process.env.DATA_DIR = "/tmp/assetpulse-data"

const handler = serverless(app)

export default handler
