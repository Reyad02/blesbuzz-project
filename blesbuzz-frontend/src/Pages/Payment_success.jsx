// Success.jsx

import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>

        <h1 className="text-3xl font-bold text-green-600 mb-3">
          Payment Successful
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been received.
        </p>

        <p className="text-gray-600 mb-8">
          Your IPTV account details will be sent to your email shortly.
        </p>

        <Link
          to="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}