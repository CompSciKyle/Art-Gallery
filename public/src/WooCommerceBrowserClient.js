import OAuth from 'oauth-1.0a';
import axios from 'axios';

// export class WooCommerceBrowserClient {
//     constructor({ url, consumerKey, consumerSecret, version = 'v3' }) {
//         if (!url) throw new Error('Missing required URL parameter');
//         this.siteURL = url.replace(/\/+$/, '');
//         this.baseURL = `${this.siteURL}/wp-json/wc/${version}`;
        
//         this.oauth = new OAuth({
//             consumer: { key: consumerKey, secret: consumerSecret },
//             signature_method: 'HMAC-SHA1',
//             hash_function: (baseString, key) => {
//                 const hash = CryptoJS.HmacSHA1(baseString, key);
//                 return CryptoJS.enc.Base64.stringify(hash);
//             }
//         });
//     }

//     async get(endpoint, params = {}) {
//         const url = new URL(endpoint, this.baseURL);
//         Object.entries(params).forEach(([key, value]) =>
//             url.searchParams.append(key, value)
//         );

//         const auth = this.oauth.toHeader(
//             this.oauth.authorize({ url: url.href, method: 'GET' })
//         );

//         return axios.get(url.href, {
//             headers: { ...auth, 'Accept': 'application/json' }
//         });
//     }

//     async createOrder(cartItems, email) {
//         const endpoint = `${this.baseURL}/orders`;
        
//         try {
//             const auth = this.oauth.toHeader(
//                 this.oauth.authorize({
//                     url: endpoint,
//                     method: 'POST'
//                 })
//             );

//             const response = await axios.post(endpoint, {
//                 payment_method: "bacs",
//                 status: "pending",
//                 set_paid: false,
//                 line_items: cartItems,
//                 billing: { email }
//             }, {
//                 headers: {
//                     ...auth,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             return {
//                 ...response.data,
//                 payment_url: `${this.siteURL}/checkout/order-pay/${response.data.id}/?pay_for_order=true&key=${response.data.order_key}`
//             };
//         } catch (error) {
//             console.error('Order creation failed:', error.response?.data || error.message);
//             throw error;
//         }
//     }
// }

export class SecureWooClient {
    constructor(workerUrl) {
      this.workerUrl = workerUrl;
    }
  
    async get(endpoint) {
        console.log('[DEBUG] Fetching:', `${this.workerUrl}/wp-json/wc/v3${endpoint}`);
        const response = await fetch(`${this.workerUrl}/wp-json/wc/v3${endpoint}`);
        
        console.log('[DEBUG] Response status:', response.status);
        const rawData = await response.text();
        console.log('[DEBUG] Raw response:', rawData);
    
        try {
          const data = JSON.parse(rawData);
          console.log('[DEBUG] Parsed data:', data);
          return data;
        } catch (e) {
          console.error('[DEBUG] JSON parse error:', e);
          return null;
        }
      }
  
      async createOrder(cartItems, email) {
        const endpoint = `${this.workerUrl}/wp-json/wc/v3/orders`;
        
        const line_items = cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            variation_id: item.variation?.id || undefined
        }));
    
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_method: "bacs",
                    status: "pending",
                    set_paid: false,
                    line_items: line_items,
                    billing: { email }
                })
            });

            console.log('[DEBUG] Order response status:', response.status);
            const rawResponse = await response.text();
            console.log('[DEBUG] Raw order response:', rawResponse);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${rawResponse}`);
            }

            const orderData = JSON.parse(rawResponse);
            return {
                ...orderData,
                // Maintain original site URL structure
                payment_url: `https://syndicate.vision/checkout/order-pay/${orderData.id}/?pay_for_order=true&key=${orderData.order_key}`
            };
        } catch (error) {
            console.error('[DEBUG] Order creation error:', error);
            throw new Error(`Order failed: ${error.message}`);
        }
    }
}