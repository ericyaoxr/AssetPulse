async function testBackendHealthCheck() {
  try {
    const regRes = await fetch("http://localhost:8642/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "aitest", password: "Test1234" }),
    })

    let token
    if (regRes.ok) {
      const regData = await regRes.json()
      token = regData.token
      console.log("Register OK")
    } else {
      const errText = await regRes.text()
      console.log("Register:", errText)
      const loginRes = await fetch("http://localhost:8642/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "aitest", password: "Test1234" }),
      })
      if (loginRes.ok) {
        token = (await loginRes.json()).token
        console.log("Login OK")
      } else {
        console.log("Login failed:", await loginRes.text())
        return
      }
    }

    const assets = [
      { id: "1", name: "iPhone 15 Pro", category: "数码电子", purchasePrice: 8999, status: "active", effectiveDays: 365, dailyCost: 24.65 }
    ]

    console.log("\nSending health-check request...")
    const checkRes = await fetch("http://localhost:8642/api/ai/health-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ assets }),
    })

    console.log("Response status:", checkRes.status)
    const responseText = await checkRes.text()
    console.log("Response body:", responseText.substring(0, 1000))
  } catch (e) {
    console.error("Error:", e.message)
  }
}

testBackendHealthCheck()
