import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminPricing() {
    const [pricing, setPricing] = useState([]);
    const [loading, setLoading] = useState(true);

    // Separate saving state for each package
    const [saving, setSaving] = useState({});

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

        updated[index] = {
            ...updated[index],
            plans: {
                ...updated[index].plans,
                [planKey]: Number(value),
            },
        };

        setPricing(updated);
    };

    // Save pricing for a specific package
    const savePricing = async (type, plans) => {
        try {
            setSaving((prev) => ({
                ...prev,
                [type]: true,
            }));

            // You can use different APIs if you want
            await axios.put(`http://localhost:3000/pricing/${type}`, {
                plans,
            });

            // alert(`Package ${type} updated successfully!`);
            toast.success(`Package ${type} pricing has been updated!`);
        } catch (err) {
            console.log(err);
            toast.error("Failed to update pricing");
        } finally {
            setSaving((prev) => ({
                ...prev,
                [type]: false,
            }));
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
        <div className="space-y-7 min-h-screen">
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
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition"
                    >
                        {/* Card Header */}
                        <div className="sticky top-0 bg-white z-10 border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-lg font-bold text-slate-800">
                                Package {item.type}
                            </h2>

                            <button
                                onClick={() =>
                                    savePricing(item.type, item.plans)
                                }
                                disabled={saving[item.type]}
                                className="btn bg-slate-700 hover:bg-slate-800 text-white btn-sm border-0"
                            >
                                {saving[item.type]
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {Object.keys(item.plans).map((key) => (
                                    <div key={key}>
                                        <label className="text-sm text-slate-500 block mb-2">
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
                                            className="input input-bordered w-full"
                                        />
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-slate-400 mt-5">
                                Tip: Changes will reflect immediately on the
                                customer pricing page after saving.
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}