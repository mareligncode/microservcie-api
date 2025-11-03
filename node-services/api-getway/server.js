const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Service routes
app.use('/auth', createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '',
    },
}));

app.use('/users', createProxyMiddleware({
    target: 'http://localhost:8002',
    changeOrigin: true,
    pathRewrite: {
        '^/users': '',
    },
}));

app.use('/products', createProxyMiddleware({
    target: 'http://localhost:8003',
    changeOrigin: true,
    pathRewrite: {
        '^/products': '',
    },
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});