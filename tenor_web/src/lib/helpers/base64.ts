// base64 to buffer
export const base64ToBuffer = (base64: string): Buffer => {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  return Buffer.from(base64Data!, "base64");
};

// Confirm base64 file is valid and return file extension
export const isBase64Valid = (base64: string): string | null => {
  try {
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
    const buffer = Buffer.from(base64Data ?? "", "base64");
    if (buffer.length > 0) {
      const mimeType = /^data:(.*?);base64,/.exec(base64)?.[1];
      if (mimeType) {
        const extension = mimeType.split("/")[1];
        return extension ?? null;
      }
    }
    return null;
  } catch (e) {
    console.error("Error parsing base64 file: ", e);
    return null;
  }
};

export const toBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
