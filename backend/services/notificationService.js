// src/services/notificationService.js
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const REGION = 'us-east-1'; // Your AWS region
const LAMBDA_FUNCTION_NAME = 'AuctionNotification'; 

const lambdaClient = new LambdaClient({ region: REGION });

async function sendNotificationEvent(payload) {
    const command = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(payload),
        InvocationType: 'Event', // Asynchronous
    });

    try {
        await lambdaClient.send(command);
        console.log(`Notification Lambda triggered for payload: ${JSON.stringify(payload)}`);
    } catch (error) {
        console.error('Lambda Invocation Error:', error);
    }
}

export { sendNotificationEvent };