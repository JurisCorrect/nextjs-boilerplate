import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received:', body)
    
    // Test simple : toujours retourner un ID factice
    return NextResponse.json({ 
      correctionId: "test-" + Date.now() 
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'API Error: ' + (error?.message || String(error))
    }, { status: 500 })
  }
}
