const express = require("express");
const { createClient } = require("redis");

const app = express();
const client = createClient();

client.on("error", (err) => {
    console.log("Redis Error:", err);
});

function rateLimiter(limit, windowSeconds){

    return async (req, res, next) => {
        try{
            const ip = req.ip;
            const key = `rate:ip:${ip}`;
            const count = await client.incr(key);
            
            if(count === 1){
                await client.expire(key, windowSeconds);
            }
            
            res.setHeader("X-RateLimit-Limit", limit);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, limit-count));
        
            if(count > limit){
                const ttl = await client.ttl(key);
                res.setHeader("Retry-After", ttl);
                
                return res.status(429).json({
                    success: false,
                    message: "Too Many Requests"
                });
            }
            next();
        }
        
        catch(error){
            console.error("Rate limiter error:", error);
            next();
        }
    };
}

async function startServer(){
    await client.connect();
    
    app.get("/api/products", rateLimiter(5, 60), (req,res) => {
        res.json({
            success: true,
            products: []
        });
    });

    app.listen(5000, () => {
        console.log("Server is running on port 5000");
    });
}

startServer();