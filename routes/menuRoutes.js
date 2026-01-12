const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// CRUD Orders
router.get('/', orderController.getOrders);
router.post('/', orderController.addOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
