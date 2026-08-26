const { createClient, WatchError } = require('redis');
const client = createClient();

client.on("error", (err) => {
    console.log("Redis Error:", err);
});

async function transferMoney(from, to, amount){

    const transferClient = createClient();

    await transferClient.connect();

    const fromKey = `balance:${from}`;
    const toKey = `balance:${to}`;

    while(true){
        try{
            await transferClient.watch(fromKey);

            const fromBalance = await transferClient.get(`balance:${from}`);
            const toBalance   = await transferClient.get(`balance:${to}`);
            
            console.log("\nBEFORE TRANSFER:");
            console.log(`${from}: ${fromBalance}`);
            console.log(`${to}: ${toBalance}`);
            
            if(Number(fromBalance) < amount){
                console.log("Insufficient Balance");

                await transferClient.unwatch();
                await transferClient.quit();
                return;
            }
            
            const result = await transferClient.multi().decrBy(fromKey, amount).incrBy(toKey, amount).exec();

            if(result == null){
                console.log("Balance changed. Retrying...");
                continue;
            }
            
            console.log("\nAFTER TRANSFER:");
            console.log(`${from}: ${await transferClient.get(`balance:${from}`)}`);
            console.log(`${to}: ${await transferClient.get(`balance:${to}`)}`);
            
            await transferClient.quit();
            
            return;
        }
        
        catch(error){
            if(error instanceof WatchError){
                console.log("Balance changed. Retrying...");
                continue;
            }
            
            console.error("Transfer failed:", error);
            await transferClient.quit();
            return;
        }
    }
}

async function main(){
    try{
        await client.connect();

        await client.set("balance:alice", 1000);
        await client.set("balance:bob", 500);

        await Promise.all([
            transferMoney("alice", "bob", 300),
            transferMoney("alice", "bob", 300)
        ]);

        console.log("\nFinal Balances:");
        console.log("Alice:", await client.get("balance:alice"));
        console.log("Bob:", await client.get("balance:bob"));
    }

    catch(error){
        console.error(error);
    }

    finally{
        if(client.isOpen)
            await client.quit();
    }
}

main();
 