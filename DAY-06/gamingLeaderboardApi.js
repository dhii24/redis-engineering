const { createClient } = require("redis");
const client = createClient();

client.on("error", (err) => {
    console.log('Redis Error:', err);
});

const leaderboard = "leaderboard:global";

async function main(){
    await client.connect();

    await client.zAdd(leaderboard, [
        {score: 1200, value: "Alice"},
        {score: 950, value: "Bob"},
        {score: 1500, value: "Charlie"},
        {score: 1100, value: "David"},
        {score: 800, value: "Eve"}
    ]);

    const allPlayers = await client.zRange(leaderboard, 0, -1, {REV: true});

    console.log("\nLeaderboard:")
    for(const player of allPlayers){
        const score = await client.zScore(leaderboard, player);
        console.log(`${player}: ${score}`);
    }

    const topThree = await client.zRange(leaderboard, 0, 2, {REV: true});

    console.log("\nTop 3:");
    topThree.forEach((player, index) => {
        console.log(`${index+1}. ${player}`);
    });
    
    console.log("\nAlice's Score:", await client.zScore(leaderboard, 'Alice'));
    
    const aliceRank = await client.zRevRank(leaderboard, 'Alice');
    console.log("Alice's RANK:", aliceRank+1);
    
    console.log("\nAlice's updated score:", await client.zIncrBy(leaderboard, 500, "Alice"));
    
    const updatedTopThree =  await client.zRange(leaderboard, 0, 2, {REV: true});

    console.log("\nUpdated Top 3:");
    updatedTopThree.forEach((player, index) => {
        console.log(`${index+1}. ${player}`);
    });

    await client.quit();
}

main();