import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function useLogout() {
  const { mutateAsync: apiLogout } = api.auth.logout.useMutation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    const res = await apiLogout();

    if (res.success) {
      queryClient.clear();
      router.push("/login");
    }
  };

  return logout;
}
