const {promisify} = require('util');

var redis = require("redis"),
    client = redis.createClient(process.env.PORT, process.env.HOST, {password: process.env.REDIS_PASSWORD});

const getAsync = promisify(client.get).bind(client);
const keysAsync = promisify(client.keys).bind(client)

module.exports = { main: async function (event, context) {
        keys = await keysAsync('*location*');

        features = await Promise.all(keys.map(async (key) => {
            return JSON.parse(await getAsync(key))
        }));

        data = {
            "type": "FeatureCollection",
            "features": features
        }
        return JSON.stringify(data);
    }
}
