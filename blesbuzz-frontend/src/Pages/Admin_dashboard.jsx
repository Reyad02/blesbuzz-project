import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const [totalPaidOrders, setTotalPaidOrders] = useState(0);
    const [totalPendingOrders, setTotalPendingOrders] = useState(0);
    const [totalPendingPaidOrders, setTotalPendingPaidOrders] = useState(0);

    const fetchOrders = async (currentPage = 1) => {
        try {
            setLoading(true);

            const res = await axios.get(
                `http://localhost:3000/orders?page=${currentPage}`
            );

            setOrders(res.data.orders);
            setTotalPages(res.data.totalPages);
            setTotalOrders(res.data.totalOrders);

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.patch(`http://localhost:3000/orders/${id}/approve`);
            fetchOrders(page);
            fetchStats(); // ✅ important

        } catch (err) {
            console.log(err);
        }
    };

    const handleDecline = async (id) => {
        try {
            await axios.patch(`http://localhost:3000/orders/${id}/decline`);
            fetchOrders(page);
            fetchStats(); // ✅ important

        } catch (err) {
            console.log(err);
        }
    };

    const fetchStats = async () => {
        try {
            const [paidRes, pendingRes, totalRes] = await Promise.all([
                axios.get("http://localhost:3000/paid-orders"),
                axios.get("http://localhost:3000/pending-orders"),
                axios.get("http://localhost:3000/total-orders"),
            ]);

            setTotalPaidOrders(paidRes.data.count);
            setTotalPendingOrders(pendingRes.data.count);
            setTotalPendingPaidOrders(totalRes.data.count);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    useEffect(() => {
        fetchStats();
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
        <div className="space-y-7 text-black">

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
                        {totalPendingPaidOrders}
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-500 text-sm">
                        Pending Orders
                    </p>

                    <h2 className="text-3xl font-bold text-yellow-600 mt-2">
                        {
                            totalPendingOrders
                        }
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-slate-500 text-sm">
                        Approved Orders
                    </p>

                    <h2 className="text-3xl font-bold text-green-600 mt-2">
                        {totalPaidOrders}
                    </h2>
                </div>

            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

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

            {/* Pagination */}
            <div className="flex flex-wrap justify-center items-center gap-2 mt-8">

                {/* Previous */}
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white 
                   hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Prev
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {(() => {
                        const pages = [];

                        const addPage = (p) => {
                            pages.push(
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`min-w-[40px] px-3 py-2 rounded-lg border text-sm transition
                        ${page === p
                                            ? "bg-slate-900 text-white border-slate-900 shadow"
                                            : "bg-white border-slate-300 hover:bg-slate-100"
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        };

                        const addDots = (key) => {
                            pages.push(
                                <span key={key} className="px-2 text-slate-400">
                                    ...
                                </span>
                            );
                        };

                        // Always show first page
                        addPage(1);

                        // Left dots
                        if (page > 3) addDots("start-dots");

                        // Middle pages
                        for (
                            let i = Math.max(2, page - 1);
                            i <= Math.min(totalPages - 1, page + 1);
                            i++
                        ) {
                            addPage(i);
                        }

                        // Right dots
                        if (page < totalPages - 2) addDots("end-dots");

                        // Always show last page (if more than 1 page)
                        if (totalPages > 1) addPage(totalPages);

                        return pages;
                    })()}
                </div>

                {/* Next */}
                <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white 
                   hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next →
                </button>
            </div>

        </div>
    );
}