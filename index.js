require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

const allowedOrigins = ['https://zentaii.com', 'https://www.zentaii.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());

const SHOP = process.env.SHOP;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wishlist Backend</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
          }
          p {
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>✅ Wishlist Backend is Running</h1>
        <p>If you're seeing this, your server is working correctly.</p>
      </body>
    </html>
  `);
});


app.post("/apps/wishlist/update", async (req, res) => {
  const { customerId, wishlist } = req.body;
  // const customerId = '8802065350953';
  // const customerGID =  'gid://shopify/Customer/8802065350953';
  // let wishlist = ['gid://shopify/Product/9458209456425', 'gid://shopify/Product/9458209423657', 'gid://shopify/Product/9458209554729']

  try {
    const existingMetafield = await getWishlistMetafield(customerId);
    const metafieldId = existingMetafield?.id;

    await saveWishlist(customerId, wishlist, metafieldId);
    res.json({ success: true, message: metafieldId ? "Wishlist updated" : "Wishlist created" });
  } catch (err) {
    console.error("❌ Error updating wishlist:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function getWishlistMetafield(customerId) {
  const url = `https://${SHOP}/admin/api/2025-04/customers/${customerId}/metafields.json`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_API_TOKEN
    }
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.errors || "Failed to fetch metafields");

  return data.metafields.find(mf => mf.namespace === "custom" && mf.key === "wishlist");
}

async function saveWishlist(customerId, wishlist, metafieldId) {
  const metafieldPayload = {
    metafield: {
      id: metafieldId,
      type: "list.product_reference",
      value: JSON.stringify(wishlist),
    }
  };

  const url = `https://${SHOP}/admin/api/2025-04/customers/${customerId}/metafields/${metafieldId}.json`

  console.log('Savings ', JSON.stringify(metafieldPayload))
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_API_TOKEN
    },
    body: JSON.stringify(metafieldPayload)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.errors || JSON.stringify(result));
  }

  console.log("Wishlist saved successfully:", result);

  return result;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Wishlist server running on http://localhost:${PORT}`);
});
