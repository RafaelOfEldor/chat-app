import React from "react";

export async function ExpressUsersPost(elementId, elementUserId) {
  await fetch(`/api/users/${elementId}/${elementUserId}`, {
    method: "DELETE",
  });
}

export async function ExpressUsersPutBio(elementBio, elementUserId) {
  await fetch(`/api/users/changebio`, {
    method: "PUT",
    body: JSON.stringify({
      user_id: elementUserId,
      updated_bio: elementBio,
    }),
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function ExpressUsersPutUsername(elementUsername, elementUserId) {
  await fetch(`/api/users/changeusername`, {
    method: "PUT",
    body: JSON.stringify({
      user_id: elementUserId,
      updated_username: elementUsername,
    }),
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function ExpressUsersDelete(elementId, elementUserId) {
  await fetch(`/api/users/${elementId}/${elementUserId}`, {
    method: "DELETE",
  });
}

//

export async function ExpressChatroomPost(elementData) {
  await fetch("/api/chats/rooms/newroom", {
    method: "POST",
    body: JSON.stringify(elementData),
    headers: {
      "content-type": "application/json",
    },
  });
}
