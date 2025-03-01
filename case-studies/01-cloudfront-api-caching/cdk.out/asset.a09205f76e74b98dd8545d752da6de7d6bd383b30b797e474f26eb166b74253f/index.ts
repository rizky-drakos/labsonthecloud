export const handler = async(event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var res ={
        "statusCode": 200,
        "headers": {
            "Cache-Control": "max-age=10",
            "Content-Type": "*/*"
        },
        "body": ""
    };
    res.body = '{"name": "Isaac"}';
    return res
};