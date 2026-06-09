import { createBrowserRouter } from "react-router";
import IPTVOrderForm from "../Pages/Place_order_form";
import Success from "../Pages/Payment_success"
import Cancel from "../Pages/Payment_cancel"

const router = createBrowserRouter([
  {
    path: "/place-order",
    Component: IPTVOrderForm,
  },
  {
    path: "/success",
    Component: Success,
  },
  {
    path: "/cancel",
    Component: Cancel,
  }
]);

export default router;