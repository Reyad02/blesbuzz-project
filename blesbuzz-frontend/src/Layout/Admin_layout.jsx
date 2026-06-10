import React from "react";
import { Outlet, Link, NavLink } from "react-router-dom";

const AdminLayout = () => {

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className="drawer lg:drawer-open min-h-screen">

            <input
                id="admin-drawer"
                type="checkbox"
                className="drawer-toggle"
            />

            {/* Main Content */}
            <div className="drawer-content flex flex-col bg-slate-100">

                {/* Mobile Navbar */}
                <div className="navbar bg-white border-b lg:hidden">
                    <div className="flex-none">
                        <label
                            htmlFor="admin-drawer"
                            className="btn btn-square btn-ghost"
                        >
                            ☰
                        </label>
                    </div>

                    <div className="flex-1">
                        <span className="text-lg font-semibold">
                            IPTV Admin
                        </span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>

            </div>

            {/* Sidebar */}
            <div className="drawer-side z-50">

                <label
                    htmlFor="admin-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                />



                <aside className="bg-slate-900 text-white w-64 min-h-full flex flex-col">

                    {/* Logo */}
                    <div className="p-6 border-b border-slate-700 ">
                        <h1 className="text-2xl font-bold">
                            IPTV Admin
                        </h1>

                        <p className="text-sm text-slate-400 mt-1">
                            Management Panel
                        </p>
                    </div>

                    {/* Navigation */}
                    <ul className="menu p-4 flex-1 space-y-2  w-full">

                        <li className="w-full ">
                            <NavLink
                                to="/admin"
                                end
                                className={({ isActive }) =>
                                    `w-full rounded-lg transition-colors ${isActive
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                📦 Orders
                            </NavLink>
                        </li>

                        <li className="w-full">
                            <NavLink
                                to="/admin/customers"
                                end
                                className={({ isActive }) =>
                                    `w-full rounded-lg transition-colors ${isActive
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                👥 Customers
                            </NavLink>
                        </li>

                        <li className="w-full">
                            <NavLink
                                to="/admin/settings"
                                end
                                className={({ isActive }) =>
                                    `w-full rounded-lg transition-colors ${isActive
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                ⚙️ Settings
                            </NavLink>
                        </li>

                    </ul>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-slate-700">

                        <button
                            onClick={handleLogout}
                            className="
    w-full
    bg-slate-800
    hover:bg-slate-700
    border
    border-slate-700
    text-slate-200
    py-3
    rounded-lg
    transition-all
    duration-200
    font-medium
  "
                        >
                            Logout
                        </button>

                    </div>

                </aside>

            </div>

        </div>
    );
};

export default AdminLayout;