import { TRPCError } from '@trpc/server';
import { doc, getDoc } from 'firebase/firestore';
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

interface UserWithFiles {
  files?: {
    url: string,
    name: string
  }[]
};

export const filesRouter = createTRPCRouter({
  getUserFiles: protectedProcedure.query(async ({ctx}) => {
    const docRef = doc(ctx.firestore, "users", ctx.session.user.id);
    const userDoc = await getDoc(docRef);

    const user = userDoc.data() as UserWithFiles;
    return user.files ?? [];
  })
});
