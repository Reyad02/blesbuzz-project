import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await axios.get("http://localhost:3000/orders");
            console.log(res.data);
            setOrders(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.patch(`http://localhost:3000/orders/${id}/approve`);
            fetchOrders(); // refresh table
        } catch (err) {
            console.log(err);
        }
    };

    const handleDecline = async (id) => {
        try {
            await axios.patch(`http://localhost:3000/orders/${id}/decline`);
            fetchOrders(); // refresh table
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "paid":
                return "text-green-600";
            case "pending":
                return "text-yellow-600";
            case "expired":
                return "text-gray-500";
            case "cancelled":
                return "text-red-600";
            default:
                return "text-black";
        }
    };

    return (
        <div className="space-y-6 text-black">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Orders Dashboard
                    </h1>

                    <p className="text-slate-500 mt-1">
                        Manage customer orders and approvals.
                    </p>
                </div>

               
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-500 text-sm">
                        Total Orders
                    </p>

                    <h2 className="text-3xl font-bold mt-2">
                        {orders.length}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-500 text-sm">
                        Pending Orders
                    </p>

                    <h2 className="text-3xl font-bold text-yellow-600 mt-2">
                        {
                            orders.filter(
                                (o) => o.approvalStatus === "pending"
                            ).length
                        }
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-500 text-sm">
                        Approved Orders
                    </p>

                    <h2 className="text-3xl font-bold text-green-600 mt-2">
                        {
                            orders.filter(
                                (o) => o.approvalStatus === "approved"
                            ).length
                        }
                    </h2>
                </div>

            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-semibold text-lg">
                        Recent Orders
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">

                        <span className="loading loading-spinner loading-lg"></span>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="table ">

                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Price</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Receipt</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="font-medium">
                                            {order.name}
                                        </td>

                                        <td>{order.email}</td>

                                        <td>{order.phone}</td>

                                        <td className="font-semibold">
                                            ${order.price}
                                        </td>

                                        <td>{order.duration}</td>

                                        <td>

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium
                      ${order.approvalStatus === "paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : order.approvalStatus === "declined" || order.approvalStatus === "cancelled"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {order.approvalStatus}
                                            </span>

                                        </td>

                                        <td>

                                            {order.receipt ? (
                                                <a
                                                    href={order.receipt}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">
                                                    —
                                                </span>
                                            )}

                                        </td>

                                        <td>
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>

                                            {order.approvalStatus ===
                                                "pending" && (
                                                    <div className="flex gap-2">

                                                        <button
                                                            onClick={() =>
                                                                handleApprove(order._id)
                                                            }
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                                                        >
                                                            Approve
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDecline(order._id)
                                                            }
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm"
                                                        >
                                                            Decline
                                                        </button>

                                                    </div>
                                                )}

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}