const express = require('express');
const multer = require("multer");
const app = express();
var cors = require('cors')
require('dotenv').config({ override: true });
const port = 3000;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
      const {name, email, phone, connections, duration, price} = req.body;

      console.log("Order Data:", { name, email, phone, connections, duration, price});

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


