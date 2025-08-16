import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sendInvitation } from "../backend/functions/send-invitation/resource";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
  
  UserProfile: a
    .model({
      firstName: a.string(),
      lastName: a.string(),
      email: a.string(),
      phone: a.string(),
      birthday: a.string(),
      gender: a.string(),
      bio: a.string(),
      location: a.string(),
      website: a.string(),
      profession: a.string(),
      company: a.string(),
      coverPhotoUrl: a.string(),
      profilePhotoUrl: a.string(),
      coverPhotoKey: a.string(),
      profilePhotoKey: a.string(),
      joinDate: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Post: a
    .model({
      content: a.string(),
      imageKeys: a.string().array(),
      imageUrls: a.string().array(),
      authorId: a.string(),
      authorName: a.string(),
      authorProfilePhoto: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      likes: a.integer().default(0),
      comments: a.integer().default(0),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(["read"])])
    .secondaryIndexes((index) => [index("authorId")]),

  Comment: a
    .model({
      content: a.string().required(),
      postId: a.id().required(),
      authorId: a.string().required(),
      authorName: a.string().required(),
      authorProfilePhoto: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(["read"])])
    .secondaryIndexes((index) => [index("postId"), index("authorId")]),

  // Custom query for sending invitations
  sendInvitation: a
    .query()
    .arguments({
      recipientEmail: a.string().required(),
      inviteMessage: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sendInvitation)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
