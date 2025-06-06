import Link from "next/link";

export default function AuthDisclaimer() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-app-text">
        By continuing, you accept our{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-app-primary underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-app-primary underline"
        >
          Privacy Policy
        </Link>
      </span>
    </div>
  );
}
