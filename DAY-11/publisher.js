const { createClient } = require("redis");

const publisher = createClient();

publisher.on("error", (err) => {
    console.log("Redis Error:", err);
});

async function startPublisher(){

    try{
        await publisher.connect();
        console.log("Publisher Connected");

        const event = {
            type: "TASK_CREATED",
            taskId: "101",
            userId: "202",
            message: "New task created"
        };

        await publisher.publish("notifications", JSON.stringify(event));

        console.log("Event Published");

    }

    catch(error){
        console.error(error);
    }

    finally{
        if(publisher.isOpen){
            await publisher.quit();
        }
    }
}
