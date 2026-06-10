import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPricing() {
    const [pricing, setPricing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch pricing
    const fetchPricing = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:3000/pricing");
            setPricing(res.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    // Update input values
    const handleChange = (index, planKey, value) => {
        const updated = [...pricing];
        updated[index].plans[planKey] = Number(value);
        setPricing(updated);
    };

    // Save pricing
    const savePricing = async (type, plans) => {
        try {
            setSaving(true);

            await axios.put(`http://localhost:3000/pricing/${type}`, {
                plans,
            });

            alert("Pricing updated successfully!");
        } catch (err) {
            console.log(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 bg-slate-50 min-h-screen">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Pricing Management
                </h1>
                <p className="text-slate-500 mt-1">
                    Update and manage all package pricing in real-time.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="space-y-8">

                {pricing.map((item, index) => (
                    <div
                        key={item.type}
                        className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition"
                    >

                        {/* Sticky Header inside card */}
                        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-lg font-bold text-slate-800">
                                Package {item.type}
                            </h2>

                            <button
                                onClick={() => savePricing(item.type, item.plans)}
                                disabled={saving}
                                className="btn btn-primary btn-sm"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                {Object.keys(item.plans).map((key) => (
                                    <div key={key} className="group">

                                        <label className="text-sm text-slate-500 group-hover:text-slate-700 transition">
                                            {key}
                                        </label>

                                        <input
                                            type="number"
                                            value={item.plans[key]}
                                            onChange={(e) =>
                                                handleChange(
                                                    index,
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            className="input input-bordered w-full mt-2 focus:ring-2 focus:ring-blue-500 transition"
                                        />
                                    </div>
                                ))}

                            </div>

                            {/* Hint */}
                            <p className="text-xs text-slate-400 mt-5">
                                Tip: Changes will reflect immediately on customer pricing page after saving.
                            </p>

                        </div>

                    </div>
                ))}

            </div>
        </div>
    );
}