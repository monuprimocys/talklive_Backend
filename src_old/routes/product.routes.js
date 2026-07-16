const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const product_controller  = require('../controller/ecomerce_controller/product.controller');

const router = express.Router();


router.use(authMiddleware)

router.post('/upload-product', product_controller.uploadProduct);
router.post('/get-product', product_controller.showProducts);


module.exports = router;