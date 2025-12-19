export async function fetchMe() {
  const res = await fetch("/me", { credentials: "include" })
  return res.json()
}

export async function fetchConversations() {
  const res = await fetch("/conversations", { credentials: "include" })
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
