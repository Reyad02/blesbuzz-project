import { createBrowserRouter } from "react-router";
import IPTVOrderForm from "../Pages/Place_order_form";
import Success from "../Pages/Payment_success"
import Cancel from "../Pages/Payment_cancel"
import AdminDashboard from "../Pages/Admin_dashboard";

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
    path: "/admin",
    Component: AdminDashboard,
  }
]);

export default router;