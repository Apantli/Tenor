import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response(JSON.stringify({ error: "Missing image URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type"),
        "Cache-Control": "s-maxage=86400, stale-while-revalidate",
      } as HeadersInit,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching image", error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
