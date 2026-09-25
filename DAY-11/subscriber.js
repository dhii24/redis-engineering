const { createClient } = require("redis");

const subscriber = createClient();

subscriber.on("error", (err) => {
    console.log("Redis Error:", err);
});

async function startSubscriber(){

    try{
        await subscriber.connect();
        console.log("Subscriber Connected");

        await subscriber.subscribe("notifications", (message) => {
            const event = JSON.parse(message);

            console.log(`Event: ${event.type}`);
            console.log(`Task: ${event.taskId}`);
            console.log(`User: ${event.userId}`);
            console.log(`Message: ${event.message}`);
        });

        console.log("Subscribed to notifications");
        }

    catch(error){
        console.error(error);
    }
    
}

startSubscriber();
