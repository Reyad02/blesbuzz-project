import { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const DEFAULT_PRICING = {
  1: { "1 Month": 0, "3 Months": 0, "6 Months": 0, "1 Year": 0 },
  2: { "1 Month": 0, "3 Months": 0, "6 Months": 0, "1 Year": 0 },
  3: { "1 Month": 0, "3 Months": 0, "6 Months": 0, "1 Year": 0 },
};

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  connections: 1,
  duration: "1 Month",
  paymentMethod: "stripe",
  receipt: null,
  deviceType: "m3u",
  macAddress: [""],
};

export default function IPTVOrderForm() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [pricingLoaded, setPricingLoaded] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const price =
    pricingLoaded && pricing[formData.connections]
      ? pricing[formData.connections][formData.duration] ?? 0
      : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]:
          name === "connections"
            ? Number(value)
            : name === "macAddress"
              ? value || []
              : value,
      };

      if (
        name === "deviceType" &&
        !["mag", "enigma2"].includes(value)
      ) {
        updated.macAddress = [];
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData, price };
      const body = { products: payload };

      console.log("Submitting order with payload:", payload);

      if (formData.paymentMethod === "stripe") {
        const response = await fetch(
          "http://localhost:3000/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const session = await response.json();
        window.location.href = session.url;
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("connections", Number(formData.connections));
      data.append("duration", formData.duration);
      data.append("price", Number(price));
      data.append("receipt", formData.receipt);
      data.append("deviceType", formData.deviceType);
      data.append(
        "macAddress",
        JSON.stringify(formData.macAddress)
      );
      await fetch("http://localhost:3000/bank-transfer-order", {
        method: "POST",
        body: data,
      });

      // alert("Order submitted successfully");
      toast.success(`Order submitted successfully!`);
      setFormData(INITIAL_FORM_DATA);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3000/pricing")
      .then((response) => {
        // Each doc: { type: 1, plans: { "1 Month": 15, "3 Months": 35, ... } }
        // Transform to: { 1: { "1 Month": 15, ... }, 2: {...}, 3: {...} }
        const transformed = response.data.reduce((acc, item) => {
          acc[item.type] = item.plans;
          return acc;
        }, {});

        setPricing(transformed);
        setPricingLoaded(true);
      })
      .catch((error) => {
        console.error("Error fetching pricing:", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Streaming Subscription
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


          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Device Type
            </label>

            <select
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="m3u">M3U</option>
              <option value="smart_tv">Smart TV</option>
              <option value="mag">MAG Box</option>
              <option value="enigma2">Enigma2</option>
            </select>
          </div>

          {/* MAC Address */}
          {(formData.deviceType === "mag" ||
            formData.deviceType === "enigma2") && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  MAC Addresses
                </label>

                {formData.macAddress.map((mac, index) => (
                  <div key={index}>
                    <label className="block text-sm text-slate-600 mb-2">
                      Connection {index + 1}
                    </label>

                    <input
                      type="text"
                      required
                      value={mac}
                      onChange={(e) => {
                        const updated = [...formData.macAddress];
                        updated[index] = e.target.value;

                        setFormData((prev) => ({
                          ...prev,
                          macAddress: updated,
                        }));
                      }}
                      placeholder="00:1A:79:XX:XX:XX"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

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
                    setFormData((prev) => ({
                      ...prev,
                      connections: conn,
                      macAddress: Array.from(
                        { length: conn },
                        (_, i) => prev.macAddress?.[i] || ""
                      ),
                    }))
                  }
                  className={`py-3 rounded-xl border text-sm font-medium transition
                    ${formData.connections === conn
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 hover:border-slate-400"
                    }`}
                >
                  {conn} Connection{conn > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Subscription Plan
            </label>

            {!pricingLoaded ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                <svg
                  className="w-5 h-5 animate-spin mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Loading plans...
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(pricing[formData.connections] ?? {}).map(
                  ([duration, amount]) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, duration })
                      }
                      className={`w-full flex items-center justify-between border rounded-xl px-4 py-4 transition
                        ${formData.duration === duration
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-300 hover:border-slate-400"
                        }`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{duration}</p>
                        {duration === "1 Year" && (
                          <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Best Value
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        ${amount}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Price</span>
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
                  setFormData({ ...formData, paymentMethod: "stripe" })
                }
                className={`border rounded-xl p-4 text-sm font-medium transition
                  ${formData.paymentMethod === "stripe"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300"
                  }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: "bank_transfer" })
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
                ref={fileInputRef}
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
            disabled={loading || !pricingLoaded}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition
              ${loading || !pricingLoaded
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
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
                    cx="12" cy="12" r="10"
                    stroke="white" strokeWidth="4"
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
