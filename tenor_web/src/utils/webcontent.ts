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

export const fetchMultipleHTML = async (urls: string[]): Promise<string[]> => {
  const htmlPromises = urls.map((link) => fetchHTML(link));
  const htmlResults = await Promise.allSettled(htmlPromises);
  const htmlContents = htmlResults.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error("Error fetching HTML:", result.reason);
      return null;
    }
  });

  // Filter out null values
  return htmlContents.filter((content) => content !== null);
};
