const {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    // DeleteItemCommand,
    ScanCommand,
    // UpdateItemCommand,
  } = require('@aws-sdk/client-dynamodb');
  const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
  const { v4: uuidv4 } = require('uuid');
  
  const client = new DynamoDBClient();
  
//   const SERIAL_NUMBER_TABLE_NAME = process.env.SERIAL_NUMBER_TABLE_NAME;
  
  // Route the request to particular function
  
  const handleRequest = async (event) => {
    const { httpMethod, path } = event;
    const response = { statusCode: 400 }; // Default response for invalid requests
  
    try {
      if (httpMethod === 'GET' && path === '/employees/allPerformanceInfo') {
        return getAllEmpPerformances();
      } else if (httpMethod === 'GET') {
        return getEmployeePerformance(event);
      } else if (httpMethod === 'POST') {
        return createEmpPerformanceInfo(event);
      } else if (httpMethod === 'PUT') {
        return updateEmployee(event);
      } else if (httpMethod === 'DELETE') {
        return deleteEmployee(event);
      } else {
        response.body = JSON.stringify({ message: 'Invalid HTTP method or path' });
      }
  
      response.statusCode = 200; // Set success status code for valid requests
    } catch (e) {
      console.error(e);
      response.statusCode = 500; // Internal server error for exceptions
      response.body = JSON.stringify({ message: `Error: ${e.message}` });
    }
  
    return response;
  };
  
  
  // Create Employee Method using async
  const createEmpPerformanceInfo = async (event) => {
    const response = { statusCode: 200 };
    try {
      const body = JSON.parse(event.body);
      
      // Insert the record with unique empId & Error hadling exception
      const personalInfoId = uuidv4();
      body.personalInfoId = personalInfoId;
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(body || {}),
      };
      const createResult = await client.send(new PutItemCommand(params));
      response.body = JSON.stringify({
        message: 'Successfully created employee PersonalInfo.',
        // createResult,
        personalInfoId,
      });
    } catch (e) {
      console.error(e);
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: 'Failed to create employee performanceInfo.',
        errorMsg: e.message,
        errorStack: e.stack,
      });
    }
    return response;
  };
  
  
//   // Update Employee-Details using async
  
//   const updateEmployee = async (event) => {
//     const response = { statusCode: 200 };
//     try {
//       const body = JSON.parse(event.body);
//       const empId = event.pathParameters ? event.pathParameters.empId : null;
  
//       if (!empId) {
//         throw new Error('empId not present');
//       }
  
//       const objKeys = Object.keys(body);
  
//       const updateParams = {
//         TableName: process.env.DYNAMODB_TABLE_NAME,
//         Key: marshall({ empId }),
//         UpdateExpression: `SET ${objKeys
//           .map((_, index) => `#key${index} = :value${index}`)
//           .join(', ')}`,
//         ExpressionAttributeNames: objKeys.reduce(
//           (acc, key, index) => ({
//             ...acc,
//             [`#key${index}`]: key,
//           }),
//           {}
//         ),
//         ExpressionAttributeValues: marshall(
//           objKeys.reduce(
//             (acc, key, index) => ({
//               ...acc,
//               [`:value${index}`]: body[key],
//             }),
//             {}
//           )
//         ),
//         ConditionExpression: 'attribute_exists(empId)', // Check if empId exists
//       };
  
//       try {
//         const updateResult = await client.send(new UpdateItemCommand(updateParams));
//         response.body = JSON.stringify({
//           message: `Successfully updated employee ${empId}.`,
//           updateResult,
//         });
//       } catch (error) {
//         if (error.name === 'ConditionalCheckFailedException') {
//           response.statusCode = 404; // Employee Id not found
//           response.body = JSON.stringify({
//             message: `Employee with empId ${empId} not found`,
//           });
//         } else {
//           throw error; // Re-throw other errors
//         }
//       }
//     } catch (e) {
//       console.error(e);
//       response.statusCode = 400;
//       response.body = JSON.stringify({
//         message: 'Failed to update employee.',
//         errorMsg: e.message,
//         errorStack: e.stack,
//       });
//     }
//     return response;
//   };
  
  
  
  // getEmployee by empID
  
  const getEmployeePerformance = async (event) => {
    const response = { statusCode: 200 };
    try {
      const empId = event.pathParameters ? event.pathParameters.empId : null;
  
      if (!empId) {
        throw new Error('empId parameter is missing');
      }
  
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ empId }),
      };
  
      const { Item } = await client.send(new GetItemCommand(params));
  
      if (Item) {
        const employeeData = unmarshall(Item);
        response.body = JSON.stringify({
          message: 'Successfully retrieved employee.',
          data: employeeData,
        });
      } else {
        response.statusCode = 404; // Employee not found
        response.body = JSON.stringify({
          message: `Employee with empId ${empId} not found`,
        });
      }
    } catch (e) {
      console.error(e);
      response.statusCode = 500; // Internal server error
      response.body = JSON.stringify({
        message: `Failed to get employee: ${e.message}`,
      });
    }
    return response;
  };
  
//   // Delete Employee by empID
  
//   const deleteEmployee = async (event) => {
//     const response = { statusCode: 200 };
//     try {
//       const empId = event.pathParameters ? event.pathParameters.empId : null;
  
//       if (!empId) {
//         throw new Error('empId parameter is missing');
//       }
  
//       const deleteParams = {
//         TableName: process.env.DYNAMODB_TABLE_NAME,
//         Key: marshall({ empId }), // Assuming you're using marshall here
//         ConditionExpression: 'attribute_exists(empId)',
//       };
  
//       try {
//         const deleteResult = await client.send(new DeleteItemCommand(deleteParams));
//         response.body = JSON.stringify({
//           message: `Successfully deleted employee have ${empId}.`,
//           deleteResult,
//         });
//       } catch (error) {
//         if (error.name === 'ConditionalCheckFailedException') {
//           response.statusCode = 404;
//           response.body = JSON.stringify({
//             message: `Employee with empId ${empId} not found`,
//           });
//         } else {
//           throw error; // Re-throw other errors
//         }
//       }
//     } catch (e) {
//       console.error(e);
//       response.statusCode = 500;
//       response.body = JSON.stringify({
//         message: 'Failed to delete employee.',
//         errorMsg: e.message,
//         errorStack: e.stack,
//       });
//     }
//     return response;
//   };
  
  
  
  // Get AllEmployees Performance List
  
  const getAllEmpPerformances = async () => {
    const response = { statusCode: 200 };
    try {
      const { Items } = await client.send(
        new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME })
      );
  
      const employees = Items.map((item) => unmarshall(item));
  
      // Sort the employees array by empId
      employees.sort((a, b) => {
        return parseInt(a.empId) - parseInt(b.empId);
      });
  
      // Modify the data to include empId
      const sortedEmployees = employees.map((employee) => ({
        empId: employee.empId,
        ...employee,
      }));
  
      response.body = JSON.stringify({
        message: 'Successfully retrieved all employees sorted by empId.',
        data: sortedEmployees,
      });
    } catch (e) {
      console.error(e);
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: 'Failed to retrieve employees.',
        errorMsg: e.message,
        errorStack: e.stack,
      });
    }
    return response;
  };
  
  
  // Generate sequential unique empID while creating Employee
  
//   const getNextSerialNumber = async () => {
//     const params = {
//       TableName: process.env.SERIAL_NUMBER_TABLE_NAME,
//       Key: {
//         id: { S: 'employeeCounter' },
//       },
//       UpdateExpression: 'SET #counter = if_not_exists(#counter, :initValue) + :incrValue',
//       ExpressionAttributeNames: {
//         '#counter': 'counter',
//       },
//       ExpressionAttributeValues: {
//         ':initValue': { N: '1000' }, // Initialize the counter if it doesn't exist (change this as needed)
//         ':incrValue': { N: '1' }, // Increment the counter by 1
//       },
//       ReturnValues: 'UPDATED_NEW',
//     };
  
//     const { Attributes } = await client.send(new UpdateItemCommand(params));
//     return Attributes.counter.N;
//   };
  
  
  module.exports = {
    handleRequest,
  };