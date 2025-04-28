export const fetchHTML = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "User-Agent": "Mozilla/5.0",
      },
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

export const fetchMultipleHTML = async (
  urls: {
    link: string;
    content: string | null;
  }[],
): Promise<{ link: string; content: string | null }[]> => {
  const htmlPromises = urls.map((url) =>
    fetchHTML(url.link).then(
      (content) => ({ link: url.link, content }),
      (error) => {
        console.error("Error fetching HTML:", error);
        return { link: url.link, content: null };
      },
    ),
  );

  const htmlResults = await Promise.all(htmlPromises);
  return htmlResults;
};
