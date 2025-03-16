import React from "react";

export default function LoadingSpinner() {
  return (
    <div>
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-y-white border-l-white border-r-transparent opacity-90"></div>
    </div>
  );
}
