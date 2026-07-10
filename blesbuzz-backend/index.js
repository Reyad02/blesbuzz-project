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



        // // STEP 3 : Create IPTV Account
        // const createResponse = await axios.post(
        //   `https://bowpanel.net/api/v1/devices/${deviceType}`,
        //   {
        //     mac: macAddress || null,
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



        // // STEP 5 : Update MongoDB
        // // await orders.updateOne(
        // //   { _id: new ObjectId(orderId) },
        // //   {
        // //     $set: {
        // //       username,
        // //       password,
        // //       streamUrl,
        // //       subscriptionId,
        // //       exp_date,
        // //     },
        // //   }
        // // );



        // //-----------------------------------
        // // STEP 6 : Send Email
        // //-----------------------------------

        // // await sendEmail(
        // //   email,
        // //   "Your IPTV Subscription Details",
        // //   mailTemplate
        // //     .replace("{{customer_name}}", clientName)
        // //     .replace("{{username}}", username)
        // //     .replace("{{password}}", password)
        // //     .replace("{{m3u_url}}", streamUrl)
        // //     .replace("{{connections}}", connections),
        // //   [
        // //     {
        // //       filename: "logo.png",
        // //       path: "./logo.png",
        // //       cid: "logo",
        // //     },
        // //   ]
        // // );

        setTimeout(() => {
          sendEmail(
            email,
            "Your IPTV Subscription Details",
            mailTemplate
              .replace("{{customer_name}}", "clientName")
              .replace("{{username}}", "username")
              .replace("{{password}}", "password")
              .replace("{{server_url}}", "http://your-iptv-server.com")
              .replace("{{m3u_url}}", "streamUrl")
              .replace("{{expiry_date}}", "exp_date")
              .replace("{{connections}}", "connections"),
            [
              {
                filename: "logo.png",
                path: "./logo.png",
                cid: "logo",
              }
            ]
          );
        }, 20000); // 20,000 ms = 20 seconds

        console.log("Provisioning completed.");

      } catch (err) {

        console.error("Provisioning Failed");

        console.error(
          err.response?.data || err.message
        );

        // await orders.updateOne(
        //   { _id: new ObjectId(orderId) },
        //   {
        //     $set: {
        //       provisioningStatus: "failed",
        //       provisioningError:
        //         err.response?.data || err.message,
        //     },
        //   }
        // );
      }
    }

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
          const price = session.metadata?.price;
          const deviceType = session.metadata?.deviceType;
          const macAddress = session.metadata?.macAddress || null;

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

          // console.log("Order Details from Stripe Webhook:", orderDetails);

          if (orderId) {
            await orders.updateOne(
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
          createdAt: new Date().toISOString(),
          username: "",
          password: "",
          streamUrl: "",
          subscriptionId: "",
          exp_date: "",
          macAddress: products.macAddress || null,
          deviceType: products.deviceType || null
        };

        const inseterdId = await orders.insertOne(newOrder);

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: products.email,
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
            deviceType: products.deviceType,
            macAddress: products.macAddress || null,
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

          const result = await orders.insertOne({
            name,
            email,
            phone,
            deviceType,
            macAddress,
            connections: Number(connections),
            duration,
            price: Number(price),
            paymentMethod: "bank-transfer",
            receipt: receiptUrl,
            approvalStatus: "pending",
            createdAt: new Date().toISOString(),
            username: "",
            password: "",
            streamUrl: "",
            subscriptionId: "",
            exp_date: "",
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

