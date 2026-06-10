import { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

const pricing = {
  1: {
    "1 Month": 15,
    "3 Months": 35,
    "6 Months": 58,
    "12 Months": 89,
  },
  2: {
    "1 Month": 27,
    "3 Months": 58,
    "6 Months": 85,
    "12 Months": 120,
  },
  3: {
    "1 Month": 40,
    "3 Months": 75,
    "6 Months": 100,
    "12 Months": 150,
  },
};

export default function IPTVOrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    connections: 1,
    duration: "1 Month",
    paymentMethod: "stripe",
    receipt: null,
  });

  const [loading, setLoading] = useState(false);

  const price =
    pricing[formData.connections][formData.duration];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.name === "connections"
          ? Number(e.target.value)
          : e.target.value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   // const stripe = await loadStripe('pk_test_51TfDD7JboLpkiQf1R6QEqJCxMzi8QypMeNdlkVHrX3sgF5Hj0NYL7pKvDUfCDToMuDHFEyFcYvgytZvPUWWSKN4f00uPYARNTd');

  //   const payload = {
  //     ...formData,
  //     price,
  //   };

  //   const body = {
  //     products: payload
  //   }

  //   if (formData.paymentMethod === "stripe") {

  //     const response = await fetch('http://localhost:3000/create-checkout-session', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(body)
  //     });

  //     const session = await response.json();

  //     window.location.href = session.url;

  //     console.log(body);
  //     return;
  //   }

  //   // Bank Transfer
  //   const data = new FormData();

  //   data.append("name", formData.name);
  //   data.append("email", formData.email);
  //   data.append("phone", formData.phone);
  //   data.append("connections", formData.connections);
  //   data.append("duration", formData.duration);
  //   data.append("price", price);
  //   data.append("receipt", formData.receipt);

  //   await fetch("http://localhost:3000/bank-transfer-order", {
  //     method: "POST",
  //     body: data,
  //   });

  //   alert("Order submitted successfully");

  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price,
      };

      const body = {
        products: payload,
      };

      if (formData.paymentMethod === "stripe") {
        const response = await fetch("http://localhost:3000/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const session = await response.json();

        window.location.href = session.url;
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("connections", formData.connections);
      data.append("duration", formData.duration);
      data.append("price", price);
      data.append("receipt", formData.receipt);

      await fetch("http://localhost:3000/bank-transfer-order", {
        method: "POST",
        body: data,
      });

      alert("Order submitted successfully");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            IPTV Subscription
          </h1>

          <p className="text-slate-500 mt-1">
            Complete your subscription purchase securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 890"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Connections */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Number of Connections
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((conn) => (
                <button
                  key={conn}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      connections: conn,
                    })
                  }
                  className={`py-3 rounded-xl border text-sm font-medium transition
                ${formData.connections === conn
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 hover:border-slate-400"
                    }`}
                >
                  {conn} Connection
                  {conn > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Subscription Plan
            </label>

            <div className="space-y-3">
              {Object.entries(
                pricing[formData.connections]
              ).map(([duration, amount]) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      duration,
                    })
                  }
                  className={`w-full flex items-center justify-between border rounded-xl px-4 py-4 transition
                ${formData.duration === duration
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                    }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-slate-900">
                      {duration}
                    </p>

                    {duration === "12 Months" && (
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Best Value
                      </span>
                    )}
                  </div>

                  <span className="text-lg font-semibold text-slate-900">
                    ${amount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">
                Total Price
              </span>

              <span className="text-2xl font-bold text-slate-900">
                ${price}
              </span>
            </div>
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Payment Method
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    paymentMethod: "stripe",
                  })
                }
                className={`border rounded-xl p-4 text-sm font-medium transition
              ${formData.paymentMethod === "stripe"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300"
                  }`}
              >
                Credit / Debit Card
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    paymentMethod: "bank_transfer",
                  })
                }
                className={`border rounded-xl p-4 text-sm font-medium transition
              ${formData.paymentMethod === "bank_transfer"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300"
                  }`}
              >
                Bank Transfer
              </button>

            </div>
          </div>

          {/* Receipt Upload */}
          {formData.paymentMethod === "bank_transfer" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Receipt
              </label>

              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receipt: e.target.files[0],
                  }))
                }
                className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none
         file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 
         file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
         hover:file:bg-blue-100"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition
    ${loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              }
    text-white
  `}
          >
            {loading ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="white"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>

                Processing...
              </>
            ) : (
              "Complete Order"
            )}
          </button>

        </form>
      </div>
    </div>
  );
}