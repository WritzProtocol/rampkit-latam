import { NextResponse } from 'next/server';
import { router } from '../router';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'execute') {
      const order = await router.executeRemittance(body.quote, body.stellarAddress, {
        fullName: body.senderName,
        email: body.senderEmail,
      });
      return NextResponse.json(order);
    }

    const quote = await router.getRemittanceQuote(body);
    if (!quote) {
      return NextResponse.json(
        { error: 'No anchor can serve this corridor right now' },
        { status: 404 }
      );
    }
    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to quote remittance' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const corridors = router.getRemittanceCorridors().map(({ from, to }) => ({
    fromCountry: from.country,
    fromCurrency: from.fiatCurrency,
    fromPaymentMethod: from.paymentMethods[0],
    toCountry: to.country,
    toCurrency: to.fiatCurrency,
    toPaymentMethod: to.paymentMethods[0],
  }));
  return NextResponse.json(corridors);
}
