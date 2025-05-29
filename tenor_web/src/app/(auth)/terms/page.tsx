import { primaryLogoPath } from "~/lib/defaultValues/publicPaths";

export default function Terms() {
  return (
    <div className="my-20 flex h-full w-full items-center justify-center">
      <div className="max-w-2xl p-4">
        <div className="mb-6 flex w-full items-center justify-center">
          <img
            src={primaryLogoPath}
            alt="Tenor Logo"
            className="h-[120px] w-auto pb-10"
          />
        </div>
        <h1 className="mb-4 text-2xl font-semibold">Terms of Service</h1>
        <p className="mb-4">
          Welcome to our Terms of Service. By using our services, you agree to
          comply with and be bound by the following terms and conditions. Please
          read them carefully.
        </p>
        <h2 className="mb-2 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using our services, you confirm that you accept these
          terms and agree to comply with them. If you do not agree to these
          terms, you must not use our services.
        </p>
        <h2 className="mb-2 text-xl font-semibold">2. Changes to Terms</h2>
        <p className="mb-4">
          We may revise these terms from time to time. The most current version
          will always be posted on our website. By continuing to use our
          services after changes are made, you agree to the revised terms.
        </p>
        <h2 className="mb-2 text-xl font-semibold">3. Use of Services</h2>
        <p className="mb-4">
          You agree to use our services only for lawful purposes and in a manner
          that does not infringe the rights of, restrict, or inhibit anyone
          else&apos;s use and enjoyment of our services.
        </p>
        <h2 className="mb-2 text-xl font-semibold">4. Intellectual Property</h2>
        <p className="mb-4">
          All content, trademarks, and other intellectual property on our
          website and services are owned by us or our licensors. You may not use
          any of our intellectual property without our express written
          permission.
        </p>
        <h2 className="mb-2 text-xl font-semibold">
          5. Limitation of Liability
        </h2>
        <p className="mb-4">
          To the fullest extent permitted by law, we will not be liable for any
          loss or damage arising from your use of our services, including but
          not limited to direct, indirect, incidental, or consequential damages.
        </p>
      </div>
    </div>
  );
}
