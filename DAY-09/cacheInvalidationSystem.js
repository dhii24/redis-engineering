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
    
    const cachedData = await client.get(key);
    
    if(cachedData){
        console.log("CACHE HIT");
        return JSON.parse(cachedData);
    }

    console.log("CACHE MISS");
    console.log("FETCHING FROM DATABASE");
    
    const productDetails = productFromDB;

    console.log("STORING IN CACHE");
    await client.set(key, JSON.stringify(productDetails), {EX: 300});
    return productDetails;
    
}

async function updateProduct(productId, newPrice){
    const key = `product:${productId}`;
    
    productFromDB.price = newPrice;
    console.log("DATABASE UPDATED");
    
    await client.del(key);
    console.log("CACHE INVALIDATED");
}

async function deleteProduct(productId){
    const key = `product:${productId}`;

    console.log("DATABASE PRODUCT DELETED");

    await client.del(key);
    console.log("CACHE INVALIDATED");
    
}

async function main(){

    try{
        await client.connect();

        console.log("===== REQUEST 1 =====");
        let product = await getProduct(101);
        console.log("Price:", product.price);
        console.log();      
        
        console.log("===== REQUEST 2 =====");
        product = await getProduct(101);
        console.log("Price:", product.price);
        console.log();      

        console.log("===== UPDATE =====");
        product = await updateProduct(101, 82000);
        console.log();      

        console.log("===== REQUEST 3 =====");
        product = await getProduct(101);
        console.log("Price:", product.price);
        console.log();    
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

main();
