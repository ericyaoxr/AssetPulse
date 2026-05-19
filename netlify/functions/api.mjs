import serverless from "serverless-http"
import app from "../../server/index.js"

process.env.NETLIFY = "true"

const handler = serverless(app)

export { handler }
