# API Specification

## Overview

This document specifies the API endpoints for a user registration and chat system. Each endpoint details the required request parameters, response objects, and possible status codes.

## Endpoints

### POST /api/register

**Description:** Endpoint to register a new user.

**Request Parameters:**

- **username** (string, required): The username of the new user.
- **password** (string, required): The password of the new user.

**Responses:**

- **200 OK:** User registered successfully. Returns the user's token.
- **409 Conflict:** User already exists.
- **400 Bad Request:** Username or password is missing.

---

### POST /api/auth

**Description:** Handle POST request to authenticate a user.

**Request Parameters:**

- **username** (string, required): The username of the user.
- **password** (string, required): The password of the user.

**Responses:**

- **200 OK:** User authenticated successfully. Returns the user's token.

---

### POST /api/updatePassword

**Description:** Update a user's password.

**Request Parameters:**

- **password** (string, required): The new password for the user.

**Responses:**

- **200 OK:** Password updated successfully.
- **400 Bad Request:** Password is missing.
- **404 Not Found:** User not found.

---

### POST /api/logout

**Description:** Log out a user.

**Request Parameters:** None

**Responses:**

- **200 OK:** User logged out successfully.
- **400 Bad Request:** User not found.

---

### POST /api/deleteUser

**Description:** Delete a user.

**Request Parameters:** None

**Responses:**

- **200 OK:** User deleted successfully.
- **400 Bad Request:** User not found.

---

### POST /api/createChat

**Description:** Create a new chat.

**Request Parameters:**

- **name** (string, required): The name of the new chat.

**Responses:**

- **200 OK:** Chat created successfully. Returns the ID of the created chat.
- **400 Bad Request:** Name is missing.
- **409 Conflict:** Chat already exists.

---

### POST /api/createChatMessage

**Description:** Create a new message in a chat.

**Request Parameters:**

- **chatId** (string, required): The ID of the chat.
- **content** (string, required): The content of the message.
- **replyId** (string, optional): The ID of the message being replied to.

**Responses:**

- **200 OK:** Message created successfully.
- **400 Bad Request:** Chat ID or content is missing.
- **404 Not Found:** Chat not found.
- **401 Unauthorized:** User is not a member of the chat.

---

### POST /api/getChatMessages

**Description:** Retrieve messages from a chat.

**Request Parameters:**

- **chatId** (string, required): The ID of the chat.

**Responses:**

- **200 OK:** Messages retrieved successfully. Returns an array of messages.
- **400 Bad Request:** Chat ID is missing.
- **404 Not Found:** Chat not found.
- **401 Unauthorized:** User is not a member of the chat.

---

### POST /api/deleteChat

**Description:** Delete a chat.

**Request Parameters:**

- **chatId** (string, required): The ID of the chat.

**Responses:**

- **200 OK:** Chat deleted successfully.
- **400 Bad Request:** Chat ID is missing.
- **404 Not Found:** Chat not found.
- **401 Unauthorized:** User is not the creator of the chat.

---

### POST /api/getInvolvedChats

**Description:** Retrieve all chats that the user is a member of.

**Request Parameters:** None

**Responses:**

- **200 OK:** Chats retrieved successfully. Returns an array of chat IDs.

---

### POST /api/getChatUsers

**Description:** Retrieve all users in a chat.

**Request Parameters:**

- **chatId** (string, required): The ID of the chat.

**Responses:**

- **200 OK:** Users retrieved successfully. Returns an array of users.
- **400 Bad Request:** Chat ID is missing.
- **404 Not Found:** Chat not found.
- **401 Unauthorized:** User is not a member of the chat.

---

### POST /api/addUserIcon

**Description:** Add an icon to a user.

**Request Parameters:**

- **icon** (string, required): The icon to be added to the user.

**Responses:**

- **200 OK:** Icon added successfully.
- **400 Bad Request:** Icon is missing.
- **404 Not Found:** User not found.

---

### POST /api/getUserIcon

**Description:** Retrieve an icon from a user.

**Request Parameters:**

- **userId** (string, required): The ID of the user.

**Responses:**

- **200 OK:** Icon retrieved successfully.
- **400 Bad Request:** User ID is missing.
- **404 Not Found:** User not found.

---

### POST /api/followUser

**Description:** Follow a user.

**Request Parameters:**

- **userId** (string, required): The ID of the user to be followed.

**Responses:**

- **200 OK:** User followed successfully.
- **400 Bad Request:** User ID is missing.
- **404 Not Found:** User not found.

---

### POST /api/unfollowUser

**Description:** Unfollow a user.

**Request Parameters:**

- **userId** (string, required): The ID of the user to be unfollowed.

**Responses:**

- **200 OK:** User unfollowed successfully.
- **400 Bad Request:** User ID is missing.
- **404 Not Found:** User not found.

---

### POST /api/sendBanner

**Description:** Send a banner to a user.

**Request Parameters:**

- **userId** (string, required): The ID of the user.
- **bannerId** (string, required): The ID of the banner.

**Responses:**

- **200 OK:** Banner sent successfully.
- **400 Bad Request:** User ID or banner ID is missing.
- **404 Not Found:** User not found.

---

### POST /api/suspension

**Description:** Suspend a user.

**Request Parameters:**

- **userId** (string, required): The ID of the user to be suspended.
- **suspensionLevel** (int, required): The level of suspension.

  ``0 - no suspension``
  ``1 - warning 1``
  ``2 - warning 2``
  ``3 - partial suspension``
  ``4 - suspended``
  ``5 - permanently suspended``

**Responses:**

- **200 OK:** User suspended successfully.
- **400 Bad Request:** User ID or suspension level is missing.
- **403 Forbidden:** User does not have permissions to suspend.

---

This concludes the API specification for the user registration and chat system. Each endpoint details the necessary request parameters and potential response codes to ensure clear and concise communication between the client and server.
