import { type NextRequest, NextResponse } from 'next/server';
import { storageAdmin, dbAdmin } from "~/lib/db/firebaseAdmin";
import { auth } from '~/server/auth';
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue
import { env } from '~/env';

export async function POST(req: NextRequest) {

  const session = await auth();

  if (!session) {
    return NextResponse.json({error: "You must log in"}, {status: 401});
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({error: "No file uploaded"}, {status: 400});
    }

    const bytes = await file.arrayBuffer();
    const bucket = storageAdmin.bucket(env.FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(`uploads/${file.name}`);

    await fileRef.save(Buffer.from(bytes));

    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-09-2491", // Set an extremely long expiration date
    });

    const docRef = dbAdmin.collection("users").doc(session.uid);
    await docRef.update({
      files: FieldValue.arrayUnion({url, name: file.name})
    });

    return NextResponse.json({url}, {status: 200});
  } catch (error) {
    console.error("Error uploading: ", error);
    return NextResponse.json({message: "Upload Failed", error}, {status: 500});
  }
}