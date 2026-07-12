const express = require('express');
const multer = require("multer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var cors = require('cors')
require('dotenv').config({ override: true });
const port = 3000;
const fs = require("fs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mailTemplate = require("./utils");
const axios = require('axios').default;


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

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sendEmail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
}

const upload = multer({ storage });

app.use(cors())

async function run() {
  try {
    const database = client.db("blesbuzz");
    const orders = database.collection("orders");
    const pricingCollection = database.collection("prices");
    const paymentsCollection = database.collection("payments");

    // IPTV credential generation and sending email to the customer
    async function ipTvAutomateProcess(orderDetails) {
      const {
        orderId,
        clientName,
        email,
        connections,
        duration,
        deviceType,
        macAddress
      } = orderDetails;

      try {

        let macArray = macAddress;

        if (typeof macArray === "string") {
          macArray = JSON.parse(macArray);
        }
        // const headers = {
        //   Accept: "application/json",
        //   "Content-Type": "application/json",
        //   "X-API-KEY": process.env.BOWPANEL_X_API_KEY,
        //   "X-API-SECRET": process.env.BOWPANEL_X_API_SECRET,
        // };


        // // STEP 1 : Get Subscription List
        // const subscriptionResponse = await axios.get(
        //   "https://bowpanel.net/api/v1/subscriptions",
        //   { headers }
        // );
        // const subscriptions = subscriptionResponse.data.data || [];



        // // STEP 2 : Find Correct Subscription
        // const selectedSubscription = subscriptions.find(sub => {
        //   return sub.label === duration;
        // });

        // if (!selectedSubscription) {
        //   throw new Error("Subscription not found.");
        // }
        // const subscriptionId = selectedSubscription.id;



        for (let i = 0; i < connections; i++) {
          const currentMac =
            ["mag", "enigma2"].includes(deviceType)
              ? macArray[i] || null
              : null;

          // STEP 3 : Create IPTV Account
          // const createResponse = await axios.post(
          //   `https://bowpanel.net/api/v1/devices/${deviceType}`,
          //   {
          //     mac: currentMac || null,
          //     subscription: subscriptionId,
          //     country: null,
          //     use_template: false,
          //     vod_only: false,
          //     bouquets: "*",
          //     vods: "*",
          //     template: null,
          //     note: `Order ID: ${orderId}, Client Name: ${clientName}, Email: ${email}`,
          //   },
          //   { headers }
          // );

          // const device = createResponse.data.data;
          // const username = device.username;
          // const password = device.password;
          // const deviceId = device.id;
          // const exp_date = device.exp_date;



          // // STEP 4 : Generate Link
          // const linkResponse = await axios.put(
          //   `https://bowpanel.net/api/v1/devices/${deviceType}/${username}/${password}/generate-link`,
          //   {},
          //   { headers }
          // );
          // const streamUrl = linkResponse.data.data.link;

          // // Demo value for testing without actual API calls

          username = `user${Math.floor(Math.random() * 100000)}`;
          password = `pass${Math.floor(Math.random() * 100000)}`;
          streamUrl = `http://your-iptv-server.com/stream/${username}/${password}`;
          // 2026-07-10
          date_exp = new Date();
          date_exp.setFullYear(date_exp.getFullYear() + 2);
          exp_date = date_exp.toISOString().split('T')[0]; // Format as YYYY-MM-DD


          // STEP 5 : Update MongoDB
          await orders.insertOne({
            orderId: new ObjectId(orderId),
            username,
            password,
            streamUrl,
            exp_date,
            macAddress: currentMac || null,
            deviceType: deviceType,
            createdAt: new Date().toISOString(),
          })

          sendEmail(
            email,
            "Your IPTV Subscription Details",
            mailTemplate
              .replace("{{customer_name}}", clientName)
              .replace("{{username}}", username)
              .replace("{{password}}", password)
              .replace("{{server_url}}", streamUrl)
              .replace("{{expiry_date}}", exp_date)
            [
            {
              filename: "logo.png",
              path: "./logo.png",
              cid: "logo",
            }
            ]
          );

        }
        console.log("Provisioning completed.");

      } catch (err) {

        console.error("Provisioning Failed");

        console.error(
          err.response?.data || err.message
        );

      }
    }

    // Stripe Webhook Endpoint to check for payment success and update the order status in MongoDB
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
          const connections = Number(session.metadata?.connections);
          const duration = session.metadata?.duration;
          const price = Number(session.metadata?.price);
          const deviceType = session.metadata?.deviceType;
          const macAddress = session.metadata?.macAddress || [];

          orderDetails = {
            orderId,
            clientName,
            email,
            connections,
            duration,
            price,
            deviceType,
            macAddress
          }

          if (orderId) {
            await paymentsCollection.updateOne(
              { _id: new ObjectId(orderId) },
              { $set: { approvalStatus: "paid" } }
            );

            ipTvAutomateProcess(orderDetails)
              .catch((err) => {
                console.error("Error in ipTvAutomateProcess:", err);
              });
          }
        }

        else if (event.type === "checkout.session.expired") {
          const session = event.data.object;
          const orderId = session.metadata?.orderId;

          if (orderId) {
            await paymentsCollection.updateOne(
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

    // Endpoint to create a Stripe checkout session
    app.post('/create-checkout-session', async (req, res) => {
      try {
        const { products } = req.body;
        const inseterdId1 = await paymentsCollection.insertOne({
          name: products.name,
          email: products.email,
          phone: products.phone,
          connections: Number(products.connections),
          duration: products.duration,
          price: Number(products.price),
          paymentMethod: "stripe",
          receipt: null,
          approvalStatus: "pending",
          createdAt: new Date().toISOString(),
          deviceType: products.deviceType,
          macAddress: products.macAddress || []
        });

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: products.email,
          success_url: `http://localhost:5173/success`,
          cancel_url: `http://localhost:5173/cancel?orderId=${inseterdId1.insertedId}`,
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
            connections: Number(products.connections),
            duration: products.duration,
            price: Number(products.price),
            deviceType: products.deviceType,
            macAddress: JSON.stringify(products.macAddress || []),
            orderId: inseterdId1.insertedId.toString()
          },
        });

        res.json({ url: session.url });
      }
      catch (err) {
        console.log(err)
      }

    });

    // Endpoint to handle bank transfer orders
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

          const {
            name,
            email,
            phone,
            deviceType,
            macAddress,
            connections,
            duration,
            price,
          } = req.body;

          const result = await paymentsCollection.insertOne({
            name,
            email,
            phone,
            connections: Number(connections),
            duration,
            price: Number(price),
            paymentMethod: "bank-transfer",
            receipt: receiptUrl,
            approvalStatus: "pending",
            createdAt: new Date().toISOString(),
            deviceType,
            macAddress: JSON.parse(macAddress || "[]")
          });

          res.status(200).json({
            success: true,
            message: "Paymentreceived",
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

    // Endpoint to handle payment cancellation by user from the stripe checkout page
    app.post("/payment-cancelled", async (req, res) => {
      try {
        const { orderId } = req.body;

        await paymentsCollection.updateOne(
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

    // Endpoint to fetch total paid orders to show in dashboard
    app.get("/paid-orders", async (req, res) => {
      try {
        const paidOrders = await paymentsCollection
          .find({ approvalStatus: "paid" })
          .sort({ _id: -1 })
          .toArray();

        const count = await paymentsCollection.countDocuments({ approvalStatus: "paid" });

        res.json({
          count,
          orders: paidOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    // Endpoint to fetch total pending orders to show in dashboard
    app.get("/pending-orders", async (req, res) => {
      try {
        const pendingOrders = await paymentsCollection
          .find({ approvalStatus: "pending" })
          .sort({ _id: -1 })
          .toArray();

        const count = await paymentsCollection.countDocuments({ approvalStatus: "pending" });

        res.json({
          count,
          orders: pendingOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    // Endpoint to fetch total orders (pending + paid) to show in dashboard
    app.get("/total-orders", async (req, res) => {
      try {
        const filter = {
          approvalStatus: { $in: ["pending", "paid"] },
        };

        const totalOrders = await paymentsCollection
          .find(filter)
          .sort({ _id: -1 })
          .toArray();

        const count = await paymentsCollection.countDocuments(filter);

        res.json({
          count,
          orders: totalOrders,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    });

    // Endpoint to fetch all orders with pagination for admin dashboard
    app.get("/orders", async (req, res) => {
      try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalOrders = await paymentsCollection.countDocuments();

        const allOrders = await paymentsCollection
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

    // Endpoint to fetch a specific order by ID and finding all the IPTV credentials associated with that order
    app.get("/orders/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await paymentsCollection.aggregate([
          {
            $match: {
              _id: new ObjectId(id),
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "orderId",
              as: "orders",
            },
          },
        ]).toArray();

        if (result.length === 0) {
          return res.status(404).json({ message: "Order not found" });
        }

        res.json(result[0]);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch order" });
      }
    });

    // Endpoint to approve an order by adming and IPTV credential generation and sending email to the customer
    app.patch("/orders/:id/approve", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await paymentsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              approvalStatus: "paid",
            },
          }
        );

        if (result.modifiedCount > 0) {
          const order = await paymentsCollection.findOne({ _id: new ObjectId(id) });
          orderDetails = {
            orderId: order._id.toString(),
            clientName: order.name,
            email: order.email,
            connections: Number(order.connections),
            duration: order.duration,
            deviceType: order.deviceType,
            macAddress: JSON.stringify(order.macAddress || [])
          }
          await ipTvAutomateProcess(orderDetails);
        }

        res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
      }
    });

    // Endpoint to decline an order by admin
    app.patch("/orders/:id/decline", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await paymentsCollection.updateOne(
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

    // Endpoint to login as admin
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

    // Endpoint to fetch pricing for admin 
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

    // Endpoint to update pricing for a specific package
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

