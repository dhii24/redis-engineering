const express = require("express");
const { createClient } = require("redis");

const app = express();

const redisClient = createClient();

redisClient.on("error", (err) => {
    console.log("Redis Error:", err);
});

const products = {
    101: {
        id: 101,
        name: "iPhone 17",
        price: 85000
    },

    102: {
        id: 102,
        name: "MacBook",
        price: 120000
    }
};

function cacheResponse(ttl){
    return async (req, res, next) => {
        const key = `api:${req.originalUrl}`;

        const cachedResponse = await redisClient.get(key);

        if(cachedResponse){
            console.log("CACHE HIT");
            return res.json(JSON.parse(cachedResponse));
        }

        console.log("CACHE MISS");

        const originalJson = res.json.bind(res);

        res.json = async (data) => {
            await redisClient.set(key, JSON.stringify(data), {EX: ttl});
        
            return originalJson(data);
        };
        
        next();
    };
}

async function getProduct(req, res){
    const productId = req.params.id;

    const product = products[productId];

    if(!product){
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return res.json({
        success: true,
        product
    })
}

async function updateProduct(req, res){
    const productId = req.params.id;
    
    const product = products[productId];
    
    if(!product){
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    products[productId] = {
        ...product,
        ...req.body
    };

    const cacheKey = `api:/api/products/${productId}`;
    
    await redisClient.del(cacheKey);

    return res.json({
        success: true,
        message: "Product updated",
        product: products[productId]
    })
}

app.get("/api/products/:id", cacheResponse(60), getProduct);

app.patch("/api/products/:id", updateProduct);

async function startServer(){
    await redisClient.connect();
    console.log("Redis connected");

    app.listen(5000, () => {
        console.log("Server running on port 5000");
    });
}

startServer();
