// File Path: app/27424534.txt/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('27424534', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}