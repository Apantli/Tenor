import { type NextRequest, NextResponse } from 'next/server';
import { storage, db } from '../../../utils/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth } from '~/server/auth';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';

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
    const fileRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(fileRef, new Uint8Array(bytes));
    const downloadURL = await getDownloadURL(fileRef);

    const docRef = doc(db, "users", session.user.id);
    await updateDoc(docRef, {
      files: arrayUnion({url: downloadURL, name: file.name})
    });

    return NextResponse.json({url: downloadURL}, {status: 200});
  } catch (error) {
    console.error("Error uploading: ", error);
    return NextResponse.json({message: "Upload Failed", error}, {status: 500});
  }
}