const axios = require('axios');
const exif = require('exif-parser');

const traceHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-Flags', 'x-ot-span-context']


const mapId = "travelermap"

module.exports = { main: async function (event, context) {
    var postID = event.data.postId;
    var url = `${process.env.GATEWAY_URL}/wp/v2/posts/${postID}?context=edit`;
    var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers);
    console.log(url);
    post = await axios.get(url,{
        headers: traceCtxHeaders,
        responseType: 'json'
    });
    console.log(post);
    media = post.data['_links']['wp:featuredmedia'][0];
    if(media && post.data['content']['raw'].indexOf(mapId) == -1){
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
            console.log("Make post")
            html = `
            <!-- wp:html -->
            <p id="${mapId}"><iframe
                width="600"
                height="450"
                frameborder="0" style="border:0"
                src="https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API}&q=${exif_data['tags']['GPSLatitude']},${exif_data['tags']['GPSLongitude']}&zoom=13" allowfullscreen>
            </iframe></p>
            <!-- /wp:html -->`
            
            content = post.data['content']['raw'] + html
            url = `${process.env.GATEWAY_URL}/wp/v2/posts/${postID}`
            resp = axios.post(url,
                {content: content},
                {   
                    headers: traceCtxHeaders,
                    responseType: 'json'
                })
            return JSON.stringify(resp, 2, true);
        }

        
        return;
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
