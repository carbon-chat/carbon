# Carbon API Documentation

## Overview

The Carbon API provides endpoints for user authentication, chat management, and messaging.

**Please Note:** _All_ parameters and responses are encrypted with RSA. Responses need to be decrypted with the private key pair of the public key used for registration. Parameters need to be encrypted with the public key used for authentication. Authentication keys (excluding the 'Bearer' prefix) need to be encrypted like parameters.

Base Port: 3000

## Authentication

### Register User

Registers a new user.

- **URL:** `/api/v1/register`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**

    ```json
    {
      "userId": "string"
    }
    ```

- **Error Responses:**
  - **Code:** `400 Bad Request` if username or password is missing.
  - **Code:** `409 Conflict` if username already exists.

### Authenticate User

Authenticates an existing user.

- **URL:** `/api/v1/auth`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**

    ```json
    {
      "userId": "string"
    }
    ```

- **Error Responses:**
  - **Code:** `400 Bad Request` if username or password is missing or incorrect.
  - **Code:** `401 Unauthorized` if authentication fails.

### Update Password

Updates the password for the authenticated user.

- **URL:** `/api/v1/updatePassword`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "password": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
- **Error Responses:**
  - **Code:** `400 Bad Request` if password is missing.

## Chat Management

### Create Chat

Creates a new chat room.

- **URL:** `/api/v1/createChat`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "name": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
  - **Content:** `chatId`
- **Error Responses:**
  - **Code:** `400 Bad Request` if name is missing.
  - **Code:** `409 Conflict` if a chat room with the same name already exists.

### Create Chat Message

Adds a new message to a chat.

- **URL:** `/api/v1/createChatMessage`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "chatId": "string",
    "content": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
- **Error Responses:**
  - **Code:** `400 Bad Request` if chatId or content is missing.
  - **Code:** `401 Unauthorized` if user is not a member of the chat.

### Get Chat Messages

Retrieves messages from a chat.

- **URL:** `/api/v1/getChatMessages`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "chatId": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
  - **Content:** Array of messages
- **Error Responses:**
  - **Code:** `400 Bad Request` if chatId is missing.
  - **Code:** `401 Unauthorized` if user is not a member of the chat.

### Get Involved Chats

Retrieves IDs of chats involving the authenticated user.

- **URL:** `/api/v1/getInvlovedChats`
- **Method:** `POST`
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:** Array of chat IDs

### Get Chat Users

Retrieves users of a chat.

- **URL:** `/api/v1/getChatUsers`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "chatId": "string"
  }
  ```

- **Success Response:**
  - **Code:** `200 OK`
  - **Content:** Array of user IDs
- **Error Responses:**
  - **Code:** `400 Bad Request` if chatId is missing.
  - **Code:** `401 Unauthorized` if user is not a member of the chat.

## Miscellaneous

### Health Check

Verifies server health.

- **URL:** `/healthcheck`
- **Method:** `GET`
- **Success Response:**
  - **Code:** `200 OK`

### Get Key

Retrieves the public key used for encryption.

- **URL:** `/api/v1/getKey`
- **Method:** `GET`
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:** Public key
