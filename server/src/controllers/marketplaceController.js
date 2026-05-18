// MokineVeto Marketplace — Products, Orders, Mobile Money
import db from '../db/index.js';

// --- Products ---
export const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    let products = await db.products.filter(p => p.isActive);
    if (category) products = products.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }
    if (minPrice) products = products.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) products = products.filter(p => p.price <= parseFloat(maxPrice));
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only vendors can create products' });
    }
    const { name, category, description, price, unit, stock } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const product = {
      id: Date.now().toString(),
      vendorId: req.user.id,
      vendorName: req.user.name || 'Vendeur',
      name, category: category || 'other', description: description || '',
      price: parseFloat(price), unit: unit || 'unite',
      stock: parseInt(stock) || 0,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await db.products.insert(product);
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await db.products.findOne(p => p.id === req.params.id && p.vendorId === req.user.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const { name, description, price, stock, isActive } = req.body;
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (price !== undefined) patch.price = parseFloat(price);
    if (stock !== undefined) patch.stock = parseInt(stock);
    if (isActive !== undefined) patch.isActive = isActive;
    if (req.file) patch.imageUrl = `/uploads/${req.file.filename}`;
    const updated = await db.products.update(req.params.id, patch);
    res.status(200).json({ message: 'Product updated', product: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Orders ---
export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, phoneNumber } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.products.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({ productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.price, subtotal });
    }

    const paymentRef = (paymentMethod === 'mobile_money' || paymentMethod === 'orange_money')
      ? `OM-${Date.now()}` : null;

    const order = {
      id: Date.now().toString(),
      buyerId: req.user.id,
      buyerName: req.user.name || 'Client',
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || '',
      paymentMethod: paymentMethod || 'mobile_money',
      paymentPhone: phoneNumber || '',
      paymentRef,
      status: 'pending',
      paymentStatus: paymentRef ? 'awaiting_confirmation' : 'pending',
      createdAt: new Date().toISOString(),
    };

    // Reduce stock for each item
    for (const item of items) {
      const product = await db.products.findById(item.productId);
      if (product) await db.products.update(item.productId, { stock: product.stock - item.quantity });
    }

    await db.orders.insert(order);
    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'vendor') {
      const allOrders = await db.orders.all();
      const myProductIds = (await db.products.filter(p => p.vendorId === req.user.id)).map(p => p.id);
      orders = allOrders.filter(o => o.items.some(i => myProductIds.includes(i.productId)));
    } else {
      orders = await db.orders.filter(o => o.buyerId === req.user.id);
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await db.orders.update(req.params.id, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paidAt: new Date().toISOString(),
    });

    const transaction = {
      id: Date.now().toString(),
      orderId: order.id,
      userId: order.buyerId,
      amount: order.totalAmount,
      method: order.paymentMethod,
      status: 'success',
      ref: order.paymentRef || `TXN-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await db.payments.insert(transaction);

    res.status(200).json({ message: 'Payment confirmed', order: updated, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorProducts = async (req, res) => {
  try {
    const products = await db.products.filter(p => p.vendorId === req.user.id);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

