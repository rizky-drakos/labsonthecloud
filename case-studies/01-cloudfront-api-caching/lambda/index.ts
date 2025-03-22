
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async(event: APIGatewayProxyEvent) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return {
        "statusCode": 200,
        "headers": {
            "Cache-Control": "max-age=10",
            "Content-Type": "*/*"
        },
        "body": JSON.stringify({ name: 'Isaac' })
    };
};