import { NextRequest, NextResponse } from 'next/server';

let clients: ((data: any) => void)[] = [];

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const sendData = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      clients.push(sendData);

      req.signal.addEventListener('abort', () => {
        clients = clients.filter(client => client != sendData);
      })
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  clients.forEach(sendData => sendData(data));

  return new NextResponse(JSON.stringify({message: 'Data received'}), {
    headers: {'Content-Type': 'application/json'}
  });
}