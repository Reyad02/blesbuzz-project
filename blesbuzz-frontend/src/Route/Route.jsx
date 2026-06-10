import { createBrowserRouter } from "react-router";
import IPTVOrderForm from "../Pages/Place_order_form";
import Success from "../Pages/Payment_success"
import Cancel from "../Pages/Payment_cancel"
import AdminDashboard from "../Pages/Admin_dashboard";
import Login from "../Pages/Login";
import PrivateRoute from "./PrivateRoute";
import Admin_layout from "../Layout/Admin_layout";

const router = createBrowserRouter([
  {
    path: "/",
    Component: IPTVOrderForm,
  },
  {
    path: "/success",
    Component: Success,
  },
  {
    path: "/cancel",
    Component: Cancel,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/admin",
    element: <Admin_layout />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        ),
      }
    ]

  }
]);

export default router;