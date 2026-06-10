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
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Admin Orders Dashboard</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Phone</th>
                                <th className="p-3 text-left">Price</th>
                                <th className="p-3 text-left">Duration</th>
                                <th className="p-3 text-left">Payment</th>
                                <th className="p-3 text-left">Receipt</th>
                                <th className="p-3 text-left">Payment Date</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order) => (
                                // <tr key={order._id} className="border-b">
                                //   <td className="p-3">{order.name}</td>
                                //   <td className="p-3">{order.email}</td>
                                //   <td className="p-3">{order.phone}</td>
                                //   <td className="p-3">${order.price}</td>
                                //   <td className="p-3">{order.duration}</td>
                                //   <td className="p-3">{order.paymentMethod}</td>

                                //   <td className={`p-3 font-semibold ${getStatusColor(order.approvalStatus)}`}>
                                //     {order.approvalStatus}
                                //   </td>

                                //   <td className="p-3">
                                //     {order.receipt ? (
                                //       <a
                                //         href={order.receipt}
                                //         target="_blank"
                                //         className="text-blue-600 underline"
                                //       >
                                //         View
                                //       </a>
                                //     ) : (
                                //       "-"
                                //     )}
                                //   </td>
                                // </tr>

                                <tr key={order._id} className="border-b">
                                    <td className="p-3">{order.name}</td>
                                    <td className="p-3">{order.email}</td>
                                    <td className="p-3">{order.phone}</td>
                                    <td className="p-3">${order.price}</td>
                                    <td className="p-3">{order.duration}</td>

                                    <td className={`p-3 font-semibold`}>
                                        {order.approvalStatus}
                                    </td>
                                    <td className="p-3">
                                        {order.receipt ? (
                                            <a
                                                href={order.receipt}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                View Receipt
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No receipt</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        {order.approvalStatus === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(order._id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => handleDecline(order._id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}