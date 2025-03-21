import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registration request received by Next.js API route:', body);

    // Forward to backend server - update port to 3001 where NestJS is running
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`Attempting to connect to backend at: ${backendUrl}/auth/register`);
    
    try {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(8000)
      });

      console.log('Response status:', response.status);
      
      // If the backend returns an error
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend registration error:', errorData);
        return NextResponse.json(
          { message: errorData.message || 'Registration failed' }, 
          { status: response.status }
        );
      }

      // Return the successful response
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack
      });
      
      return NextResponse.json(
        { 
          message: `Failed to connect to backend server at ${backendUrl}/auth/register. Error: ${fetchError.message}`,
          error: 'BACKEND_CONNECTION_ERROR' 
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Registration proxy error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your registration' },
      { status: 500 }
    );
  }
} 