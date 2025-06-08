export const fetchText = async (file64: string): Promise<string> => {
  const matches = /^data:(.*);base64,(.*)$/.exec(file64);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 file format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  if (!mimeType || !base64Data) {
    throw new Error("Invalid base64 file format");
  }

  const binaryData = atob(base64Data);
  const arrayBuffer = new Uint8Array(binaryData.length);

  for (let i = 0; i < binaryData.length; i++) {
    arrayBuffer[i] = binaryData.charCodeAt(i);
  }

  // MIME type to extension map
  const extensionMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "text/csv": "csv",
  };

  const extension = extensionMap[mimeType];
  if (!extension) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const file = new File([arrayBuffer], `upload.${extension}`, {
    type: mimeType,
  });

  if (extension === "txt" || extension === "csv") {
    return await file.text();
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`https://parse-file-xtamobifyq-uc.a.run.app`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const jsonResponse = (await response.json()) as { error?: string };
    throw new Error(
      `Failed to parse file: ${jsonResponse.error ?? response.statusText}`,
    );
  }

  const json = (await response.json()) as {
    data?: { text: string; name: string }[];
    error?: string;
  };
  const text = json?.data?.[0]?.text ?? "";

  return text;
};

export const fetchMultipleFiles = async (
  files: string[],
): Promise<string[]> => {
  const filePromises = files.map((file) => fetchText(file));
  const fileResults = await Promise.allSettled(filePromises);
  const fileContents = fileResults.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error("Error fetching file:", result.reason);
      return null;
    }
  });

  // Filter out null values
  return fileContents.filter((content) => content !== null);
};
