// Pipeline all products in one batch


const redis = require("redis");

const client = redis.createClient();

client.on("error", (err) => {
    console.log("Redis Error:", err);
});

const products = [
    { id: 101, name: "iPhone 17", price: 85000 },
    { id: 102, name: "MacBook", price: 120000 },
    { id: 103, name: "AirPods", price: 20000 },
    { id: 104, name: "iPad", price: 60000 },
    { id: 105, name: "Apple Watch", price: 45000 }
];

async function cacheProducts(products){
    const pipeline = client.multi();

    for(const product of products){
        const key = `product:${product.id}`;

        pipeline.set(key, JSON.stringify(product)).expire(key, 300);
    }
    
    await pipeline.exec();
}

async function getProducts(products){
    const pipeline = client.multi();

    for(const product of products){
        pipeline.get(`product:${product.id}`);
    }

    const results = await pipeline.exec();

    return results.map((result) => JSON.parse(result));
}

async function main(){
    await client.connect();

    await cacheProducts(products);
    console.log("Products cached successfully.");

    const cachedProducts = await getProducts(products);
    console.log("\nCached Products:");

    cachedProducts.forEach(product => {
        console.log(product);
    });

    await client.quit();
}

main();