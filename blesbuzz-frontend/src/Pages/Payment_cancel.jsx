// Cancel.jsx

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Cancel() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      axios.post("http://localhost:3000/payment-cancelled", { orderId })
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">❌</div>

        <h1 className="text-3xl font-bold text-red-600 mb-3">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 mb-8">
          Your payment was cancelled. No charges were made.
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}