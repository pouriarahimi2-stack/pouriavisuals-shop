// File Path: app/27424534.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('27424534', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}