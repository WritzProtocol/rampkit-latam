import { NextResponse } from 'next/server';
import { router } from '../router';

export async function POST(request: Request) {
  try {
    const { action, quote, stellarAddress } = await request.json();
    
    if (action === 'execute') {
      const order = await router.executeRamp(quote, stellarAddress);
      return NextResponse.json(order);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute ramp' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const anchorId = searchParams.get('anchorId');

  if (!orderId || !anchorId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const status = await router.getStatus(orderId, anchorId as any);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
