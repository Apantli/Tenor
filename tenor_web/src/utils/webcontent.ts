export const fetchHTML = async (url: string): Promise<string> => {
  const normalizedUrl = normalizeUrl(url);

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.google.com/",
      },
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    throw new Error(`Failed to fetch HTML: ${(error as Error).message}`);
  }
};

// add protocol if not present
const normalizeUrl = (url: string): string => {
  url = url.trim();

  if (!/^[a-zA-Z]+:\/\//.exec(url)) {
    return `https://${url}`;
  }

  return url;
};

export const fetchMultipleHTML = async (
  urls: {
    link: string;
    content: string | null;
  }[],
): Promise<{ link: string; content: string | null }[]> => {
  const htmlPromises = urls.map((url) =>
    fetchHTML(url.link).then(
      (content) => ({ link: url.link, content: content.slice(0, 10_000) }),
      (error) => {
        console.error("Error fetching HTML:", error);
        return { link: url.link, content: null };
      },
    ),
  );

  const htmlResults = await Promise.all(htmlPromises);
  return htmlResults;
};
