export async function fetchMe() {
  const res = await fetch("/me", { credentials: "include" })
  return res.json()
}

export async function fetchConversations() {
  // Add cache-busting timestamp to ensure fresh data
  const timestamp = new Date().getTime()
  const res = await fetch(`/conversations?t=${timestamp}`, { 
    credentials: "include",
    cache: "no-store"
  })
  return res.json()
}

export async function fetchMessages(conversationId) {
  const res = await fetch(
    `/conversations/${conversationId}/messages`,
    { credentials: "include" }
  )
  return res.json()
}


export async function sendMessageApi(conversationId, content) {
  const res = await fetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      conversation_id: conversationId,
      content
    })
  })

  return res.json()
}

export async function likeConversation(conversationId) {
  const res = await fetch(`/conversations/${conversationId}/like`, {
    method: "POST",
    credentials: "include"
  })
  return res.json()
}

export async function unlikeConversation(conversationId) {
  const res = await fetch(`/conversations/${conversationId}/like`, {
    method: "DELETE",
    credentials: "include"
  })
  return res.json()
}

export async function likeGroup(groupId) {
  const res = await fetch(`/groups/${groupId}/like`, {
    method: "POST",
    credentials: "include"
  })
  return res.json()
}

export async function unlikeGroup(groupId) {
  const res = await fetch(`/groups/${groupId}/like`, {
    method: "DELETE",
    credentials: "include"
  })
  return res.json()
}

export async function getMessageColor() {
  const res = await fetch("/message-color", { credentials: "include" })
  return res.json()
}

export async function saveMessageColor(color) {
  const res = await fetch("/message-color", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ color })
  })
  return res.json()
}

export async function fetchUserProfile(userId) {
  const res = await fetch(`/users/${userId}`, { credentials: "include" })
  return res.json()
}
