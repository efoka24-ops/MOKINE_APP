export const processPayment = (req, res) => {
  try {
    const { amount, paymentMethod, appointmentId } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    // Simulate payment processing
    const payment = {
      id: Date.now().toString(),
      userId: req.user.id,
      appointmentId: appointmentId || null,
      amount,
      paymentMethod,
      status: 'completed',
      transactionDate: new Date()
    };

    res.status(201).json({ message: 'Payment processed successfully', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentHistory = (req, res) => {
  try {
    // Mock payment history
    const payments = [
      {
        id: '1',
        userId: req.user.id,
        amount: 5000,
        paymentMethod: 'card',
        status: 'completed',
        transactionDate: new Date('2026-03-01')
      }
    ];

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refundPayment = (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Simulate refund
    const refund = {
      id: Date.now().toString(),
      paymentId,
      reason: reason || '',
      status: 'completed',
      refundDate: new Date()
    };

    res.status(200).json({ message: 'Refund processed', refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
