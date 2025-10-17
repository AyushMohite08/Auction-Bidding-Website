// This function will be called from your routes
export const sendNotificationEvent = (req, payload) => {
  if (req.io) {
    console.log(`Emitting notification:`, payload);
    // Emit an event (e.g., 'new_notification') with the payload
    req.io.emit('new_notification', payload);
  } else {
    console.error('Socket.io server not found on request object.');
  }
};

// // src/services/notificationService.js
// import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// const REGION = 'us-east-1'; // Your AWS region
// const LAMBDA_FUNCTION_NAME = 'AuctionNotification'; 

// const lambdaClient = new LambdaClient({ region: REGION });

// export const sendNotificationEvent = async (payload) => {
//     const command = new InvokeCommand({
//         FunctionName: LAMBDA_FUNCTION_NAME,
//         Payload: JSON.stringify(payload),
//         InvocationType: 'Event', // Asynchronous
//     });

//     try {
//         await lambdaClient.send(command);
//         console.log(`Notification Lambda triggered for payload: ${JSON.stringify(payload)}`);
//     } catch (error) {
//         console.error('Lambda Invocation Error:', error);
//     }
// }