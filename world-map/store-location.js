var redis = require("redis"),
    client = redis.createClient(process.env.PORT, process.env.HOST, {password: process.env.REDIS_PASSWORD});

const axios = require('axios');
const exif = require('exif-parser');

const traceHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-Flags', 'x-ot-span-context']


module.exports = { main: async function (event, context) {
    var postID = event.data.postId;
    var url = `${process.env.GATEWAY_URL}/wp/v2/posts/${postID}?context=edit`;
    var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers);
    console.log(url);
    post = await axios.get(url,{
        headers: traceCtxHeaders,
        responseType: 'json'
    });
    media = post.data['_links']['wp:featuredmedia'][0];
    if(media){
        console.log(media);
        image_data = await axios.get(media.href,{
            headers: traceCtxHeaders,
            responseType: 'json'
        });
        image = await axios.get(image_data.data['source_url'],{
            headers: traceCtxHeaders,
            responseType: 'arraybuffer'
        });

        parser = exif.create(await image.data)
        exif_data = parser.parse()
        if(exif_data['tags']['GPSLatitude'] != undefined && exif_data['tags']['GPSLongitude'] != undefined){
            data = {
                "type": "Feature",
                "properties": {
                    "name": post.data['title']['rendered'],
                    "link": post.data['link']
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [exif_data['tags']['GPSLongitude'], exif_data['tags']['GPSLatitude']]
                }
            };
            client.set("location:" + postID, JSON.stringify(data));
        }
    }
} }

function extractTraceHeaders(headers) {
    console.log(headers)
    var map = {};
    for (var i in traceHeaders) {
        h = traceHeaders[i]
        headerVal = headers[h]
        console.log('header' + h + "-" + headerVal)
        if (headerVal !== undefined) {
            console.log('if not undefined header' + h + "-" + headerVal)
            map[h] = headerVal
        }
    }
    return map;
}
