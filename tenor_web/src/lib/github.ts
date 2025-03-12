import { z } from "zod";

const GitHubEmailSchema = z.object({
  email: z.string(),
  primary: z.boolean(),
  verified: z.boolean(),
  visibility: z.union([z.literal("public"), z.literal("private")]).nullish(),
});

export const getEmails = async (
  accessToken: string,
): Promise<z.infer<typeof GitHubEmailSchema>[]> => {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    const emails = z.array(GitHubEmailSchema).parse(await response.json());
    return emails;
  } else {
    throw new Error("Failed to fetch emails");
  }
};
