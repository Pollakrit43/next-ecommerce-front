import {mongooseConnect} from "@/lib/mongoose";
const stripe = require('stripe')(process.env.STRIPE_SK);
import {buffer} from 'micro';
import {Order} from "@/models/Order";

const endpointSecret = "whsec_e6a82d45e390b4eb7c1ae8a8658ccdf3b89ae27a9e339a921f656e4c9910490e";

export default async function handler(req,res) {
    await mongooseConnect();
    const sig = req.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(await buffer(req), sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const data = event.data.object;
        const orderId = data.metadata.orderId;
        const paid = data.payment_status === 'paid';
        if (orderId && paid) {
          await Order.findByIdAndUpdate(orderId,{
            paid:true,
          })
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    res.status(200).send('ok');
  }
  
  export const config = {
    api: {bodyParser:false,}
  };


// elate-poised-enjoy-supurb
// acct_1NIxiKA1b8vOOx1H