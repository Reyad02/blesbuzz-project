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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stripe = await loadStripe('pk_test_51TfDD7JboLpkiQf1R6QEqJCxMzi8QypMeNdlkVHrX3sgF5Hj0NYL7pKvDUfCDToMuDHFEyFcYvgytZvPUWWSKN4f00uPYARNTd');


    const payload = {
      ...formData,
      price,
    };

    const body = {
      products: payload
    }

    if (formData.paymentMethod === "stripe") {

      const response = await fetch('http://localhost:3000/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      //  const result = await stripe.redirectToCheckout({
      //   sessionId: session.id,
      // });

      window.location.href = session.url;

      console.log(body);
      return;
    }

    // Bank Transfer
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

    // send to n8n webhook
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-6">
          IPTV Subscription Order
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2 font-medium">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Number of Connections
            </label>
            <select
              name="connections"
              value={formData.connections}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value={1}>1 Connection</option>
              <option value={2}>2 Connections</option>
              <option value={3}>3 Connections</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Subscription Duration
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option>1 Month</option>
              <option>3 Months</option>
              <option>6 Months</option>
              <option>12 Months</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-600">
              Selected Plan
            </p>

            <h3 className="text-3xl font-bold text-blue-600">
              ${price}
            </h3>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Payment Method
            </label>

            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="stripe">Credit/Debit Card (Stripe)</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {formData.paymentMethod === "bank_transfer" && (
            <div>
              <label className="block mb-2 font-medium">
                Upload Receipt / Payment Screenshot
              </label>

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receipt: e.target.files[0],
                  }))
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
          >
            Place Order
          </button>

        </form>
      </div>
    </div>
  );
}