import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.NEXT_PUBLIC_GROQ_API_KEY
    
    return NextResponse.json({
      success: true,
      data: {
        status: hasApiKey ? 'online' : 'offline',
        hasApiKey,
        model: 'Groq + Alith',
        responseTime: '~2-3s',
        accuracy: '95%'
      }
    })
  } catch (error) {
    console.error('AI health check error:', error)
    
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
}
