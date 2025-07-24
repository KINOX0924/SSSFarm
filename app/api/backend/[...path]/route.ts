// Next.js API 라우트 - FastAPI 프록시

import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sssfarm-fast-api.onrender.com'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path ? params.path.join('/') : ''
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const fullPath = queryString ? `/${path}?${queryString}` : `/${path}`
  
  try {
    console.log(`🔄 Proxy GET: ${API_BASE_URL}${fullPath}`)
    
    const response = await fetch(`${API_BASE_URL}${fullPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`❌ Proxy GET Error ${response.status}:`, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`✅ Proxy GET Success: ${fullPath}`)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Proxy GET failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        url: `${API_BASE_URL}${fullPath}`
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path ? params.path.join('/') : ''
  const fullPath = `/${path}`
  
  try {
    const body = await request.json().catch(() => null)
    console.log(`🔄 Proxy POST: ${API_BASE_URL}${fullPath}`)
    
    const response = await fetch(`${API_BASE_URL}${fullPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`❌ Proxy POST Error ${response.status}:`, errorText)
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`✅ Proxy POST Success: ${fullPath}`)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Proxy POST failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        url: `${API_BASE_URL}${fullPath}`
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path ? params.path.join('/') : ''
  const fullPath = `/${path}`
  
  try {
    const body = await request.json().catch(() => null)
    console.log(`🔄 Proxy PUT: ${API_BASE_URL}${fullPath}`)
    
    const response = await fetch(`${API_BASE_URL}${fullPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Proxy PUT failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path ? params.path.join('/') : ''
  const fullPath = `/${path}`
  
  try {
    console.log(`🔄 Proxy DELETE: ${API_BASE_URL}${fullPath}`)
    
    const response = await fetch(`${API_BASE_URL}${fullPath}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Proxy DELETE failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
