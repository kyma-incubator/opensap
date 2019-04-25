var Twitter = require('twitter');

const axios = require('axios');

const traceHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-Flags', 'x-ot-span-context']

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });


module.exports = { main: function (event, context) {
    var postID = event.data.postId;
    var url = `${process.env.GATEWAY_URL}/wp/v2/posts/${postID}?context=edit`;
    var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers);
    console.log(url);
    axios.get(url,{
        headers: traceCtxHeaders,
        responseType: 'json'
    }).then(function (response) {
        console.log(response);
        tweet = {
            status: 'I was on travel again: ' + response.data['title']['raw'] + ' ' + response.data['link'] + ' #travel #awesome'
        }
        client.post('statuses/update', tweet,  function(error, tweet, response) {
            console.log(error);
            console.log(tweet);  // Tweet body.
            console.log(response);  // Raw response object.
        });
    });
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
