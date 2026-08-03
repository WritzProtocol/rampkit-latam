import { NextResponse } from 'next/server';
import { router } from '../router';

export async function GET() {
  try {
    const assets = await router.getYieldBearingAssets();
    return NextResponse.json(assets);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
