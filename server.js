require('dotenv').config();
const express = require('express');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const products = [
  {
    id: 1,
    title: 'MacBook Air 2021',
    category: 'Electronics',
    price: 58999,
    condition: 'Like New',
    location: 'Bengaluru',
    seller: 'Karan',
    description: 'Apple M1 laptop with 8GB RAM and 256GB SSD.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    title: 'Royal Enfield Classic 350',
    category: 'Vehicles',
    price: 145000,
    condition: 'Well Used',
    location: 'Hyderabad',
    seller: 'Arjun',
    description: 'Very clean bike with proper service history.',
    image: 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    title: 'Nike Air Max',
    category: 'Fashion',
    price: 3400,
    condition: 'Almost New',
    location: 'Delhi',
    seller: 'Aisha',
    description: 'Premium sneakers, size UK 7, lightly used.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    title: 'Study Table Set',
    category: 'Furniture',
    price: 8200,
    condition: 'Good',
    location: 'Pune',
    seller: 'Nikhil',
    description: 'Wooden desk with shelf and chair included.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 5,
    title: 'Sony WH-1000XM4',
    category: 'Electronics',
    price: 16999,
    condition: 'Excellent',
    location: 'Mumbai',
    seller: 'Kavya',
    description: 'Noise cancelling headphones in excellent condition.',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 6,
    title: 'Mountain Bike',
    category: 'Sports',
    price: 18500,
    condition: 'Used',
    location: 'Chennai',
    seller: 'Sanjay',
    description: '21-speed bike for city riding and trails.',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'
  }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/sell', (req, res) => {
  const { title, category, price, condition, location, description, image } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: 'Title and price are required.' });
  }

  const newProduct = {
    id: Date.now(),
    title,
    category: category || 'General',
    price: Number(price),
    condition: condition || 'Used',
    location: location || 'Local',
    seller: 'You',
    description: description || 'Second-hand item listed by user.',
    image: image || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'
  };

  products.unshift(newProduct);
  res.status(201).json({ message: 'Product listed successfully!', product: newProduct });
});

app.post('/api/create-checkout-session', async (req, res) => {
  const { items } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: 'No items selected for checkout.' });
  }

  const lineItems = items.map(item => ({
    price_data: {
      currency: 'inr',
      product_data: {
        name: item.title,
        images: [item.image]
      },
      unit_amount: Math.round(item.price * 100)
    },
    quantity: 1
  }));

  if (!stripe) {
    return res.json({
      success: true,
      demoMode: true,
      message: 'Demo payment mode is active. Add Stripe key for real payment.',
      checkoutUrl: '/payment-success.html'
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3000/payment-success.html',
      cancel_url: 'http://localhost:3000/payment-cancel.html'
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ success: false, message: 'Payment failed. Try again.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Jspmunihub is running on http://localhost:${PORT}`);
});