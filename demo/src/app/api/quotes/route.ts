import { NextResponse } from 'next/server';
import { router } from '../router';

export async function POST(request: Request) {
  try {
    const params = await request.json();
    const quotes = await router.getQuotes(params);
    return NextResponse.json(quotes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
