require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const SHOP = process.env.SHOP;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

app.post("/apps/wishlist/update", async (req, res) => {
  const { customerGID, wishlist } = req.body;

  if (!customerGID || !wishlist) {
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  const query = `
    mutation UpdateCustomerWishlist($input: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $input) {
        metafields {
          id
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: [
      {
        ownerId: customerGID,
        namespace: "custom",
        key: "wishlist",
        type: "list.product_reference",
        value: JSON.stringify(wishlist),
      }
    ]
  };

  try {
    const response = await fetch(`https://${SHOP}/admin/api/2024-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_API_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    const errors = result?.data?.metafieldsSet?.userErrors;

    if (errors?.length) {
      return res.status(400).json({ success: false, error: errors });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Wishlist server running on http://localhost:${PORT}`);
});
