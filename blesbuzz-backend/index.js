const express = require('express');
const multer = require("multer");
const app = express();
var cors = require('cors')
require('dotenv').config({ override: true });
const port = 3000;
const axios = require("axios");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Stripe webhook signature error:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type !== "checkout.session.completed") {
      return res.json({ received: true });
    }

    const session = event.data.object;
    const customerEmail =
      session.metadata?.email || session.customer_details?.email;
    const customerName =
      session.metadata?.client_name || session.customer_details?.name || "Customer";

    // try {
    // const bowpanelResponse = await axios.post(
    //   `https://bowpanel.net/api/v1/devices/${process.env.BOWPANEL_DEVICE_TYPE}`,
    //   {
    //     subscription: Number(process.env.BOWPANEL_SUBSCRIPTION_ID),
    //     country: null,
    //     use_template: false,
    //     vod_only: false,
    //     note: `Paid order for ${customerName}`,
    //   },
    //   {
    //     headers: {
    //       "X-API-KEY": process.env.BOWPANEL_API_KEY,
    //       "X-API-SECRET": process.env.BOWPANEL_API_SECRET,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // const device = bowpanelResponse.data?.item || bowpanelResponse.data;
    // const username = device?.username || bowpanelResponse.data?.username;
    // const password = device?.password || bowpanelResponse.data?.password;

    // if (!customerEmail) {
    //   throw new Error("Customer email not found in Stripe session");
    // }

    //       await mailTransporter.sendMail({
    //         from: process.env.MAIL_FROM,
    //         to: customerEmail,
    //         subject: "Your IPTV account details",
    //         text: `Hi ${customerName},

    // Your payment was successful.

    // Your IPTV login details:
    // Username: ${username}
    // Password: ${password}

    // If you need help, reply to this email.`,
    //       });

    //       return res.json({ received: true });
    //     } catch (error) {
    //       console.error(
    //         "Provisioning/email error:",
    //         error.response?.data || error.message
    //       );
    //       return res.status(500).json({ error: "Provisioning failed" });
    //     }

    console.log(`Payment successful for ${customerName} (${customerEmail})`);
    return res.json({ received: true });
  }
);

app.use(express.json());
app.use(cors())

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { products } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      success_url: `http://localhost:5173/success`,
      cancel_url: 'http://localhost:5173/cancel',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `IPTV Subscription - ${products.duration} for ${products.connections} devices`,
            },
            unit_amount: parseInt(products.price) * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',

      metadata: {
        client_name: products.name,
        email: products.email,
        phone: products.phone,
        connections: products.connections,
        duration: products.duration,
        price: products.price,
      },
    });

    res.json({ url: session.url });
  }
  catch (err) {
    console.log(err)
  }

});

app.post(
  "/bank-transfer-order",
  upload.single("receipt"),
  async (req, res) => {
    try {
      const { name, email, phone, connections, duration, price } = req.body;

      console.log("Order Data:", { name, email, phone, connections, duration, price });

      console.log("Uploaded File:", req.file);

      // TODO:
      // Save to database
      // Send to n8n webhook
      // Send email notification

      res.status(200).json({
        success: true,
        message: "Order received successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }
);


