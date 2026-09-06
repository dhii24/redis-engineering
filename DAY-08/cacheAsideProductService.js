const { createClient } = require("redis");

const client = createClient();

client.on("error", (err) => {
    console.log("Redis error:", err);
});

const productFromDB = {
    id: 101,
    name: "iPhone 17",
    price: 85000,
    stock: 20
};

async function getProduct(productId){

    const key = `product:${productId}`;

    const cachedProduct = await client.get(key);

    if(cachedProduct){
        console.log("CACHE HIT");
        return JSON.parse(cachedProduct);
    }

    console.log("CACHE MISS");
    console.log("FETCHING FROM DATABASE");
    const product = productFromDB;

    console.log("STORING IN CACHE");
    await client.set(key, JSON.stringify(product),{EX: 60});

    return product;

}

async function productCacheAsideSystem(){

    try{
        await client.connect();
        await client.del("product:101");

        console.log("===== Request 1 =====");
        const product1 = await getProduct(101);

        console.log("Product:", product1);
        console.log();
        
        console.log("===== Request 2 =====");
        const product2 = await getProduct(101);

        console.log("Product:", product2);

    }

    catch(error){
        console.error(error);
    }

    finally{
        if(client.isOpen){
            await client.disconnect();
        }
    }
}

productCacheAsideSystem();