import Link from "next/link";
import SignIn from "~/app/_components/auth/SignIn";
import SignInGithub from "~/app/_components/auth/SignInGithub";

export default function LoginPage() {
  return (
    <div className="mx-auto flex h-screen max-w-[300px] flex-col items-center justify-center gap-4">
      <img
        className="h-[80px] w-auto"
        src="/logos/primary_logo.png"
        alt="Tenor logo"
      />
      <h1 className="text-xl font-semibold text-app-text">Sign in to Tenor</h1>
      <div className="flex w-full flex-col gap-4">
        <SignInGithub />
        <div className="flex items-center gap-5">
          <div className="h-[1px] w-full border-t border-app-border"></div>
          <span className="text-app-border">or</span>
          <div className="h-[1px] w-full border-t border-app-border"></div>
        </div>
        <SignIn />
      </div>
      <div className="flex w-full flex-col">
        <Link href="/register" className="w-full text-right text-app-primary">
          Don&apos;t have an account?
        </Link>
      </div>
    </div>
  );
}
