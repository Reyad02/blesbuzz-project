const express = require('express');
const multer = require("multer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var cors = require('cors')
require('dotenv').config({ override: true });
const port = 3000;
const axios = require("axios");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


app.use(cors())

async function run() {
  try {
    const database = client.db("blesbuzz");
    const orders = database.collection("orders");

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

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const orderId = session.metadata?.orderId;

          if (orderId) {
            await orders.updateOne(
              { _id: new ObjectId(orderId) },
              { $set: { approvalStatus: "paid" } }
            );
          }
        }

        else if (event.type === "checkout.session.expired") {
          const session = event.data.object;
          const orderId = session.metadata?.orderId;

          if (orderId) {
            await orders.updateOne(
              { _id: new ObjectId(orderId) },
              { $set: { approvalStatus: "expired" } }
            );
          }
        }

        return res.json({ received: true });
      }
    );

    app.use(express.json());
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });

    app.post('/create-checkout-session', async (req, res) => {
      try {
        const { products } = req.body;

        const newOrder = {
          name: products.name,
          email: products.email,
          phone: products.phone,
          connections: products.connections,
          duration: products.duration,
          price: products.price,
          paymentMethod: "stripe",
          receipt: null,
          approvalStatus: "pending",
        };

        const inseterdId = await orders.insertOne(newOrder);

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          success_url: `http://localhost:5173/success`,
          cancel_url: `http://localhost:5173/cancel?orderId=${inseterdId.insertedId}`,
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
            orderId: inseterdId.insertedId.toString()
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

          const result = await orders.insertOne({
            name,
            email,
            phone,
            connections: Number(connections),
            duration,
            price: Number(price),
            paymentMethod: "bank-transfer",
            receipt: req.file ? req.file.path : null,
            approvalStatus: "pending",
          });

          res.status(200).json({
            success: true,
            message: "Order received successfully",
            data: result
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

    app.post("/payment-cancelled", async (req, res) => {
      try {
        const { orderId } = req.body;

        await orders.updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              approvalStatus: "cancelled",
            },
          }
        );

        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
      }
    });

  } finally { }
}
run().catch(console.dir);

