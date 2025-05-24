const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static('public'));

app.use(bodyParser.json());

app.use(bodyParser.raw({ type: 'application/json' }));

const CONNECTED_ACCOUNT_ID = 'acct_1RSCgTRhwk3BcY4W';

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: "Support Men's Wellness",
            },
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: 20, 
        transfer_data: {
          destination: CONNECTED_ACCOUNT_ID,
        },
      },
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("❌ Error in /create-checkout-session:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      console.log("✅ Donation successful! Session ID:", event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log("❌ Payment failed.");
      break;
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
  res.send();
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
