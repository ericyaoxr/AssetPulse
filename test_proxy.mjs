async function testViaProxy() {
  try {
    const loginRes = await fetch("http://localhost:5173/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "aitest", password: "Test1234" }),
    })

    let token
    if (loginRes.ok) {
      token = (await loginRes.json()).token
      console.log("Login OK via proxy")
    } else {
      console.log("Login failed:", loginRes.status, await loginRes.text())
      return
    }

    const assets = [
      { id: "1", name: "iPhone 15 Pro", category: "数码电子", purchasePrice: 8999, status: "active", effectiveDays: 365, dailyCost: 24.65 }
    ]

    console.log("\nSending health-check request via proxy...")
    const checkRes = await fetch("http://localhost:5173/api/ai/health-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ assets }),
    })

    console.log("Response status:", checkRes.status)
    const responseText = await checkRes.text()
    console.log("Response body:", responseText.substring(0, 500))
  } catch (e) {
    console.error("Error:", e.message)
  }
}

testViaProxy()
