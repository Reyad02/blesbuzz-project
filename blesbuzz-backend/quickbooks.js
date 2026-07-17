const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');

function createOAuthClient() {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT, // 'sandbox' | 'production'
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
  });
}

function getQboClient(token) {
  return new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID,
    process.env.QUICKBOOKS_CLIENT_SECRET,
    token.access_token,
    false,
    token.realmId,
    process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox',
    false,
    null,
    '2.0',
    token.refresh_token
  );
}

function findOrCreateCustomer(qbo, { name, email, phone }) {
  return new Promise((resolve, reject) => {
    qbo.findCustomers({ PrimaryEmailAddr: email }, (err, results) => {
      if (err) return reject(err);
      const existing = results?.QueryResponse?.Customer || [];
      if (existing.length > 0) return resolve(existing[0].Id);

      qbo.createCustomer(
        {
          DisplayName: name,
          PrimaryEmailAddr: { Address: email },
          PrimaryPhone: phone ? { FreeFormNumber: phone } : undefined,
        },
        (createErr, customer) => {
          if (createErr) return reject(createErr);
          resolve(customer.Id);
        }
      );
    });
  });
}

function createSalesReceipt(qbo, { customerId, itemId, amount, description }) {
  return new Promise((resolve, reject) => {
    qbo.createSalesReceipt(
      {
        CustomerRef: { value: customerId },
        Line: [
          {
            Amount: amount,
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: { ItemRef: { value: itemId } },
            Description: description
          }
        ],

        // "Line": [
        //   {
        //     "Description": "Pest Control Services",
        //     "DetailType": "SalesItemLineDetail",
        //     "SalesItemLineDetail": {
        //       "TaxCodeRef": {
        //         "value": "NON"
        //       },
        //       "Qty": 1,
        //       "UnitPrice": 35,
        //       "ItemRef": {
        //         "name": "Pest Control",
        //         "value": "10"
        //       }
        //     },
        //     "LineNum": 1,
        //     "Amount": 35.0,
        //     "Id": "1"
        //   }
        // ]
      },
      (err, receipt) => (err ? reject(err) : resolve(receipt))
    );
  });
}

// async function createInvoiceAndMarkPaid(qbo, { customerId, itemId, amount, description }) {
//   const invoice = await new Promise((resolve, reject) => {
//     qbo.createInvoice(
//       {
//         CustomerRef: { value: customerId },
//         Line: [
//           {
//             Amount: amount,
//             DetailType: 'SalesItemLineDetail',
//             SalesItemLineDetail: { ItemRef: { value: itemId } },
//           },
//         ],
//       },
//       (err, inv) => (err ? reject(err) : resolve(inv))
//     );
//   });

//   const payment = await new Promise((resolve, reject) => {
//     qbo.createPayment(
//       {
//         CustomerRef: { value: customerId },
//         TotalAmt: amount,
//         Line: [{ Amount: amount, LinkedTxn: [{ TxnId: invoice.Id, TxnType: 'Invoice' }] }],
//       },
//       (err, pmt) => (err ? reject(err) : resolve(pmt))
//     );
//   });

//   return { invoice, payment };
// }

// Call this once inside run(), right after `database`/`paymentsCollection` are defined.
// Returns { syncOrderToQuickBooks } for use in your two payment-confirmation hooks.
function registerQuickBooksRoutes(app, database) {
  const tokensCollection = database.collection('qbTokens');
  const paymentsCollection = database.collection('payments');
  const oauthClient = createOAuthClient();

  // Rehydrate the saved token on boot (single QuickBooks company for now)
  (async () => {
    const saved = await tokensCollection.findOne({ _id: 'qb-token' });
    if (saved) oauthClient.setToken(saved.token);
  })();

  async function persistToken() {
    await tokensCollection.updateOne(
      { _id: 'qb-token' },
      { $set: { token: oauthClient.getToken(), updatedAt: new Date() } },
      { upsert: true }
    );
  }

  async function ensureFreshToken() {
    if (!oauthClient.isAccessTokenValid()) {
      await oauthClient.refresh();
      await persistToken();
    }
    return oauthClient.getToken();
  }

  // paymentType: "online" (stripe) or "local" (bank-transfer, admin approved)
  async function syncOrderToQuickBooks(order, paymentType, itemId) {
    try {
      const token = await ensureFreshToken();
      const qbo = getQboClient(token);

      console.log(`Syncing order ${order} to QuickBooks as ${paymentType} payment... ${itemId}`);
      const customerId = await findOrCreateCustomer(qbo, {
        name: order.name || order.clientName,
        email: order.email,
        phone: order.phone,
      });

      // TODO: replace with a per-plan lookup once you add a qboItemId field
      // to your `prices` collection (see INTEGRATION_GUIDE.md).
      // const itemId = process.env.QB_DEFAULT_ITEM_ID;

      // const result =
      //   paymentType === 'online'
      //     ? await createSalesReceipt(qbo, { customerId, itemId, amount: order.price, description: `IPTV Subscription - ${order.duration} for ${order.connections} devices` })
      //     : await createInvoiceAndMarkPaid(qbo, { customerId, itemId, amount: order.price, description: `IPTV Subscription - ${order.duration} for ${order.connections} devices` });

      const result = await createSalesReceipt(qbo, { customerId, itemId, amount: order.price, description: `IPTV Subscription - ${order.duration} for ${order.connections} devices` });
      await paymentsCollection.updateOne(
        { _id: order._id },
        { $set: { quickbooksSync: { status: 'success', syncedAt: new Date() } } }
      );

      return result;
    } catch (err) {
      console.error('QuickBooks sync failed:', err.message);
      await paymentsCollection.updateOne(
        { _id: order._id },
        { $set: { quickbooksSync: { status: 'failed', error: err.message, syncedAt: new Date() } } }
      );
    }
  }

  // One-time admin action: visit this URL, log into QuickBooks, approve access
  app.get('/quickbooks/connect', (req, res) => {
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'blesbuzz-qb-connect',
    });
    res.redirect(authUri);
  });

  app.get('/callback', async (req, res) => {
    try {
      await oauthClient.createToken(req.url);
      await persistToken();
      res.send('QuickBooks connected. You can close this tab.');
    } catch (err) {
      console.error('QuickBooks OAuth callback failed:', err);
      res.status(500).send('QuickBooks connection failed. Check server logs.');
    }
  });

  app.get("/quickbooks/items", async (req, res) => {
    try {
      const token = await ensureFreshToken();
      const qbo = getQboClient(token);
      console.log("Fetching items from QuickBooks...", qbo);


      // qbo.query("SELECT * FROM Item", (err, data) => {

      //   console.log(JSON.stringify(data, null, 2));

      //   if (err) {
      //     console.log(err);
      //     return res.status(500).json(err);
      //   }

      //   res.json(data);

      // });

    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  });

  return { syncOrderToQuickBooks };
}

module.exports = { registerQuickBooksRoutes };
