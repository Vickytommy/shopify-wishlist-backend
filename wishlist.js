// const wishlistKey = 'myWishlist';

//   function getWishlist() {
//     return JSON.parse(localStorage.getItem(wishlistKey)) || [];
//   }

//   // function saveWishlist(wishlist) {
//   //   localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
//   // }
//   function saveWishlist(wishlist) {
//     localStorage.setItem('myWishlist', JSON.stringify(wishlist));
//     document.cookie = `myWishlist=${wishlist.join(',')}; path=/`;
//   }


//   function toggleWishlist(handle) {
//     const wishlist = getWishlist();
//     const index = wishlist.indexOf(handle);
//     if (index > -1) {
//       wishlist.splice(index, 1); // remove
//     } else {
//       wishlist.push(handle); // add
//     }
//     saveWishlist(wishlist);
//   }

//   document.addEventListener('DOMContentLoaded', function () {
//     document.querySelectorAll('.add-to-wishlist').forEach(btn => {
//       btn.addEventListener('click', function () {
//         const handle = this.dataset.productHandle;
//         toggleWishlist(handle);
//         alert('Wishlist updated!');
//       });
//     });

//     // On the wishlist page
//     // if (document.getElementById('wishlist-items')) {
//     //   const wishlist = getWishlist();
//     //   if (wishlist.length === 0) {
//     //     document.getElementById('wishlist-items').innerHTML = '<p>Your wishlist is empty.</p>';
//     //     return;
//     //   }

//     //   // Fetch product info using handles
//     //   fetch('/products.json')
//     //     .then(res => res.json())
//     //     .then(data => {
//     //       const products = data.products.filter(p => wishlist.includes(p.handle));
//     //       console.log('Wishlist products:', products);
//     //       const html = products.map(p => {
//     //         const price = p.variants && p.variants[0] ? p.variants[0].price : 'N/A';
//     //         const variantId = p.variants && p.variants[0] ? p.variants[0].id : '';

//     //         return `
//     //           <div class="wishlist-product">
//     //             <a href="/products/${p.handle}">
//     //           <img src="${p.images[0].src}" style="max-width:100%" />
//     //           <p>${p.title}</p>
//     //             </a>
//     //             <p>${price}</p>
//     //             <form method="post" action="/cart/add">
//     //           <input type="hidden" name="id" value="${variantId}">
//     //           <button type="submit">Add to Cart</button>
//     //             </form>
//     //           </div>
//     //         `;
//     //       }).join('');

//     //     document.getElementById('wishlist-items').innerHTML = html;
//     //   });
//     // }
// });

document.addEventListener("DOMContentLoaded", function () {
  const customerId = window.shopifyCustomerId;
  const customerGID = `gid://shopify/Customer/${customerId}`;
  let customerWishList = window.customerWishlist || [];

  if (customerId) {
      console.log("Customer GID:", customerGID, customerId, customerWishList);
    // You can now use this GID in your GraphQL mutation
  } else {
    console.log("Customer not logged in.");
  }
  
  const wishlistButtons = document.querySelectorAll(".add-to-wishlist");
  const wishlistCountEl = document.getElementById("wt-count");

  // These are injected via Liquid
  // const customerAccessToken = localStorage.getItem("customerAccessToken");

  const customerAccessToken = window.customerAccessToken; // must be passed in via Liquid
  const storefrontAccessToken = window.storefrontAccessToken; // passed via Liquid
  const shopUrl = window.shopDomain || location.hostname;

  const metafieldNamespace = "custom";
  const metafieldKey = "wishlist";

  let wishlist = window.customerWishlist || [];

  // Graceful fallback if customer not logged in
  if (!customerAccessToken || !storefrontAccessToken) {
    console.warn("Customer not logged in or missing tokens.");
    console.log('Wishlist:', customerAccessToken, storefrontAccessToken, shopUrl);
    return;
  }

  wishlistButtons.forEach(button => {
    const handle = button.dataset.productHandle;
    if (wishlist.includes(handle)) {
      button.classList.add("active");
    }

    button.addEventListener("click", async function () {
      const handle = this.dataset.productHandle;
      const id_ = this.dataset.productId;
      const currentProductGID = `gid://shopify/Product/${id_}`;
      
      // Check if product is already in wishlist
      const alreadyExists = wishlist.includes(currentProductGID);
    
      if (alreadyExists) {
        console.log("Product already in wishlist.");
      } else {
        customerWishList.push(currentProductGID); // Add new product
        console.log("Product id added.", currentProductGID, customerWishList);
        update(customerGID, customerWishList); // Send to backend
      }

      
      // const isAdding = !wishlist.includes(handle);

      // if (isAdding) {
      //   wishlist.push(handle);
      //   showSuccessNotification("Added to Wishlist.");
      // } else {
      //   const index = wishlist.indexOf(handle);
      //   if (index > -1) wishlist.splice(index, 1);
      //   showSuccessNotification("Removed from Wishlist.");
      // }

      // await updateCustomerMetafield(wishlist);
      // this.classList.toggle("active");
      // updateWishlistCount();
    });
  });

  // Function to update metafield via your backend (you must build this endpoint)
  function update(customerGID, updatedWishlist) {
    const payload = {
      customerGID,
      wishlist: updatedWishlist,
    };
  
    fetch("/apps/wishlist/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          console.log("Wishlist updated successfully.");
        } else {
          console.error("Wishlist update failed:", res.error);
        }
      })
      .catch((err) => {
        console.error("Wishlist update error:", err);
      });
  }
  

  function updateWishlistCount() {
    if (!wishlistCountEl) return;
    if (wishlist.length > 0) {
      wishlistCountEl.textContent = wishlist.length;
      wishlistCountEl.style.display = "flex";
    } else {
      wishlistCountEl.textContent = "";
      wishlistCountEl.style.display = "none";
    }
  }

  function showSuccessNotification(message) {
    const existing = document.getElementById("success-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "success-notification";
    notification.className = "success-notification";
    notification.innerHTML = `
      <div class="success-msg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" class="icon icon-checkmark" viewBox="0 0 12 9">
          <path fill="currentColor" fill-rule="evenodd" d="M11.35.643a.5.5 0 0 1 .006.707l-6.77 6.886a.5.5 0 0 1-.719-.006L.638 4.845a.5.5 0 1 1 .724-.69l2.872 3.011 6.41-6.517a.5.5 0 0 1 .707-.006z" clip-rule="evenodd"/>
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 1000);
    }, 2000);
  }

  async function updateCustomerMetafield(updatedWishlist) {
    const mutation = `
      mutation customerUpdate($customerAccessToken: String!, $metafields: [MetafieldsSetInput!]!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: {
          metafields: $metafields
        }) {
          customer {
            id
            metafields(first: 10) {
              edges {
                node {
                  key
                  value
                }
              }
            }
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      customerAccessToken: customerAccessToken,
      metafields: [
        {
          namespace: metafieldNamespace,
          key: metafieldKey,
          type: "json",
          value: JSON.stringify(updatedWishlist)
        }
      ]
    };

    const response = await fetch(`https://${shopUrl}/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const result = await response.json();

    if (result.errors || result.data.customerUpdate.customerUserErrors.length > 0) {
      console.error("Error updating metafield:", result);
    } else {
      console.log("Wishlist updated successfully.");
    }
  }

  updateWishlistCount();
});
