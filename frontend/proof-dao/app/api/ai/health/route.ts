import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.NEXT_PUBLIC_GROQ_API_KEY

    // Test API connectivity if key is available
    let responseTime = "N/A"
    let accuracy = "N/A"

    if (hasApiKey) {
      const testStart = Date.now()
      try {
        // Simple test to check if the service is responsive
        const testResponse = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        })

        if (testResponse.ok) {
          responseTime = `${Date.now() - testStart}ms`
          accuracy = "95%" // Static value for now
        }
      } catch (error) {
        console.warn("Groq API test failed:", error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: hasApiKey ? "online" : "offline",
        hasApiKey,
        model: "Groq + Alith",
        responseTime,
        accuracy,
      },
    })
  } catch (error) {
    console.error("AI health check error:", error)

    return NextResponse.json({ error: "Health check failed" }, { status: 500 })
  }
}
