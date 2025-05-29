import { storageAdmin } from "~/lib/db/firebaseAdmin";
import { env } from "~/env";
import { base64ToBuffer } from "~/lib/helpers/base64";

export const uploadBase64File = async (
  uploadPath: string,
  base64: string,
  contentType = "application/octet-stream",
): Promise<string> => {
  const buffer = base64ToBuffer(base64);
  const bucket = storageAdmin.bucket(env.FIREBASE_STORAGE_BUCKET);
  const fileRef = bucket.file(uploadPath);

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

export const deleteFile = async (filePath: string) => {
  const bucket = storageAdmin.bucket(env.FIREBASE_STORAGE_BUCKET);
  const fileRef = bucket.file(filePath);

  await fileRef.delete();
};

export const getLogoPath = ({
  logo,
  projectId,
}: {
  logo: string;
  projectId: string;
}) => {
  return `${projectStorgeDirectory(projectId)}/${logo}`;
};

const projectStorgeDirectory = (projectId: string) => {
  return `uploads/${projectId}`;
};

export const deleteStartsWith = async (prefix: string) => {
  const bucket = storageAdmin.bucket(env.FIREBASE_STORAGE_BUCKET);
  const [files] = await bucket.getFiles({ prefix });

  await Promise.all(
    files.map((file) => {
      return file.delete();
    }),
  );
};
