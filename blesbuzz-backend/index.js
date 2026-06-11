const express = require('express');
const multer = require("multer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var cors = require('cors')
require('dotenv').config({ override: true });
const port = 3000;
const fs = require("fs");
const jwt = require("jsonwebtoken");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const pricingCollection = database.collection("prices");

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
          const clientName = session.metadata?.client_name;
          const email = session.metadata?.email;
          const connections = session.metadata?.connections;
          const duration = session.metadata?.duration;
          const price = session.metadata?.price;

          if (orderId) {
            await orders.updateOne(
              { _id: new ObjectId(orderId) },
              { $set: { approvalStatus: "paid" } }
            );
          }

          // you can send an email to the client here using nodemailer or any email service


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
          createdAt: new Date().toISOString()
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

          let receiptUrl = null;
          if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(
              req.file.path,
              {
                folder: "iptv-receipts",
                resource_type: "auto",
              }
            );

            receiptUrl = uploadResult.secure_url;
            fs.unlinkSync(req.file.path);
          }

          const { name, email, phone, connections, duration, price } = req.body;

          const result = await orders.insertOne({
            name,
            email,
            phone,
            connections: Number(connections),
            duration,
            price: Number(price),
            paymentMethod: "bank-transfer",
            receipt: receiptUrl,
            approvalStatus: "pending",
            createdAt: new Date().toISOString()
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

    app.get("/paid-orders", async (req, res) => {
      try {
        const paidOrders = await orders
          .find({ approvalStatus: "paid" })
          .sort({ _id: -1 })
          .toArray();

        const count = await orders.countDocuments({ approvalStatus: "paid" });

        res.json({
          count,
          orders: paidOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    app.get("/pending-orders", async (req, res) => {
      try {
        const pendingOrders = await orders
          .find({ approvalStatus: "pending" })
          .sort({ _id: -1 })
          .toArray();

        const count = await orders.countDocuments({ approvalStatus: "pending" });

        res.json({
          count,
          orders: pendingOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    app.get("/total-orders", async (req, res) => {
      try {
        const filter = {
          approvalStatus: { $in: ["pending", "paid"] },
        };

        const totalOrders = await orders
          .find(filter)
          .sort({ _id: -1 })
          .toArray();

        const count = await orders.countDocuments(filter);

        res.json({
          count,
          orders: totalOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    app.get("/orders", async (req, res) => {
      try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalOrders = await orders.countDocuments();

        const allOrders = await orders
          .find({})
          .sort({ createdAt: -1 }) // newest first
          .skip(skip)
          .limit(limit)
          .toArray();

        res.json({
          orders: allOrders,
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Failed to fetch orders",
        });
      }
    });

    app.patch("/orders/:id/approve", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await orders.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              approvalStatus: "paid",
            },
          }
        );

        res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
      }
    });

    app.patch("/orders/:id/decline", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await orders.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              approvalStatus: "declined",
            },
          }
        );

        res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
      }
    });

    app.post("/admin/login", async (req, res) => {
      const { email, password } = req.body;

      const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

      if (
        email !== ADMIN_EMAIL ||
        password !== ADMIN_PASSWORD
      ) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token });
    });

    app.get("/pricing", async (req, res) => {
      try {
        const data = await pricingCollection
          .find({})
          .sort({ type: 1 })
          .toArray();

        res.json(data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch pricing" });
      }
    });

    app.get("/pricing-in-form", async (req, res) => {
      try {
        const data = await pricingCollection.find({}).toArray();

        const formatted = data.reduce((acc, item) => {
          const { type, duration, price } = item;

          if (!acc[type]) {
            acc[type] = {};
          }

          acc[type][duration] = price;

          return acc;
        }, {});

        res.json(formatted);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch pricing" });
      }
    });

    app.put("/pricing/:type", async (req, res) => {
      try {
        const type = Number(req.params.type);
        const { plans } = req.body;

        await pricingCollection.updateOne(
          { type },
          {
            $set: {
              plans,
            },
          },
          { upsert: true }
        );

        res.json({ message: "Pricing updated successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update pricing" });
      }
    });

  } finally { }
}
run().catch(console.dir);

