// Redis Session Manager with Express.

const express = require("express");
const { createClient } = require("redis");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
const client = createClient();

client.on("error", (err) => {
    console.log("Redis Error:", err);
});

app.use(express.json());
app.use(cookieParser());

app.post("/login", async (req, res) => {
    try{
        const { userId } = req.body;
        if(!userId){
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const sessionId = crypto.randomUUID();
        const sessionData = {
            userId: userId
        };

        await client.set(`session:${sessionId}`, JSON.stringify(sessionData), {EX: 300});

        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            // secure: true,
            maxAge: 300 * 1000
        });

        res.json({
            success: true,
            message: "Login Successful"
        });
    }

    catch(error){
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

app.get("/profile", async (req, res) => {
    try{
        const sessionId = req.cookies.sessionId;
        if(!sessionId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const sessionData = await client.get(`session:${sessionId}`);
        if(!sessionData){
            return res.status(401).json({
                success: false,
                message: "session expired or invalid"
            });
        }

        const user = JSON.parse(sessionData);

        res.json({
            success: true,
            user
        });
    }

    catch(error){
        console.error(error);
    
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

app.post("/logout", async (req, res) => {
    try{
        const sessionId = req.cookies.sessionId;
        
        if(sessionId){
            await client.del(`session:${sessionId}`);
        }
        
        res.clearCookie("sessionId",{
            httpOnly: true,
            // secure: true
        });
        
        res.json({
            success: true,
            message: "Logout Successful"
        });
    }
    
    catch(error){
        console.error(error);
    
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

async function startServer(){
    await client.connect();

    app.listen(5000, () => {
        console.log("Server is running on port 5000")
    });
}

startServer();