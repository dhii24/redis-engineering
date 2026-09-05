const { createClient } = require("redis");
const client = createClient();

client.on("error", (err) => {
    console.log("Redis error:", err);
});

const productFromDB = {
    id: 101,
    name: "iPhone 17",
    price: 85000
};

async function getProduct(){
    const cachedProduct = await client.get("product:101");

    if(cachedProduct){
        console.log("Cache HIT");
        return JSON.parse(cachedProduct);
    }
    console.log(cachedProduct);

    console.log("Cache MISS");
    console.log("Fetching from MongoDB...");

    const product = productFromDB;

    await client.set("product:101", JSON.stringify(product), {
        EX: 60
    });

    return product;
}

async function productCacheAsideSystem(){
    try{
        await client.connect();

        console.log("===== Request 1 =====");
        let product = await getProduct();
        console.log("Product:", product.name);
        console.log();

        console.log("===== Request 2 =====");
        product = await getProduct();
        console.log("Product:", product.name);
    }

    catch(error){
        console.error(error);
    }

    finally{
        if(client.isOpen){
            client.disconnect();
        }
    }
}

productCacheAsideSystem();
