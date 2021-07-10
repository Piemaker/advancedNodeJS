// Do not change this file
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main(callback) {
    process.env.MONGO_URI="mongodb+srv://OSM:databasepassword@cluster0.rcgt2.mongodb.net/database?retryWrites=true&w=majority" 
    const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file
    const client = new MongoClient(URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        await callback(client);

    } catch (e) {
        // Catch any errors
        console.error(e);
        throw new Error('Unable to Connect to Database')
    }
}

module.exports = main;