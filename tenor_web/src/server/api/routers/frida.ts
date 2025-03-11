import { METHODS, request } from 'http';
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const fridaRouter = createTRPCRouter({
  generateREQ: publicProcedure.input(z.string()).query(async ({input}) => {
    const result = await fetch('http://localhost:6453/generateREQ', 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "context": input
    })});
    return await result.json();
  })
});
