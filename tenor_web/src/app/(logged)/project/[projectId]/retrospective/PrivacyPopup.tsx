import React from "react";
import Popup from "~/app/_components/Popup";

interface Props {
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
}

export default function PrivacyPopup({ showPopup, setShowPopup }: Props) {
  // TODO: Confirm with the client if this is the correct text

  return (
    <Popup
      show={showPopup}
      size="small"
      className="h-[600px] max-h-[min(600px,calc(100vh-80px))] w-[600px] max-w-[min(600px,calc(100vw-80px))]"
      dismiss={() => {
        setShowPopup(false);
      }}
      reduceTopPadding
      zIndex={100001}
      title={
        <h1 className="mb-4 text-3xl">
          <span className="font-semibold">Privacy policy</span>
        </h1>
      }
    >
      <div className="mt-4 space-y-4 text-lg">
        <p>
          <strong>Your Privacy Matters</strong>
        </p>
        <p>
          When you use <em>Conversation Mode</em>, your voice and biometric data
          are processed securely. We do <strong>not</strong> store your raw
          voice recordings or biometric data directly.
        </p>
        <p>
          Instead, your voice data is first converted to text using
          speech-to-text technology. Only the resulting text and analysis are
          stored—never the original audio. Similarly, biometric data is
          analyzed, and only the results of that analysis are saved.
        </p>
        <p>
          <strong>
            Your raw voice and biometric data remain private and are never
            accessible to anyone but you.
          </strong>{" "}
          No one else, including our team, can access your original data.
        </p>
        <p>
          We are committed to protecting your privacy and ensuring your data is
          handled responsibly.
        </p>
      </div>
    </Popup>
  );
}
