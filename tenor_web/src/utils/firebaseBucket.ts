import { storageAdmin } from "~/utils/firebaseAdmin";
import { env } from "~/env";
import { base64ToBuffer } from "~/utils/base64";

export const uploadBase64File = async (
  uploadPath: string,
  base64: string,
  contentType = "application/octet-stream",
): Promise<string> => {
  const buffer = base64ToBuffer(base64);
  const bucket = storageAdmin.bucket(env.FIREBASE_STORAGE_BUCKET);
  const fileRef = bucket.file(`uploads/${uploadPath}`);

  await fileRef.save(buffer, {
    metadata: {
      contentType,
    },
  });

  const [url] = await fileRef.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });

  return url;
};
