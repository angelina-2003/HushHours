import { state } from "../state.js"
import { fetchMessages, sendMessageApi } from "./api.js"
import { dom } from "../utils/dom/js"


async function loadMessages() {
  if (!state.ACTIVE_CONVERSATION_ID) return

  const messages = await fetchMessages(state.ACTIVE_CONVERSATION_ID)
  const messagesDiv = dom.messages()

  messagesDiv.innerHTML = ""

  // Use ID as secondary sort for messages with same timestamp
  messages.sort((a, b) => {
    const timeA = new Date(a.created_at || a.timestamp || 0).getTime()
    const timeB = new Date(b.created_at || b.timestamp || 0).getTime()
    if (timeA !== timeB) return timeA - timeB
    // If timestamps are equal, sort by ID (earlier messages have lower IDs)
    return (a.id || 0) - (b.id || 0)
  })

  messages.forEach(msg => {
    const row = document.createElement("div")
    
    const avatar = msg.sender_avatar || (msg.sender_id === state.CURRENT_USER_ID ? state.CURRENT_USER_AVATAR : null)
    const avatarSrc = avatar ? `/static/avatars/${avatar}` : '/static/avatars/default.png'

    if (msg.sender_id === state.CURRENT_USER_ID) {
      row.className = "message-row outgoing-row"
      row.innerHTML = `
        <div class="message outgoing">
          <p class="text">${msg.content}</p>
        </div>
        <img class="message-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
      `
    } else {
      row.className = "message-row incoming-row"
      row.innerHTML = `
        <img class="message-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
        <div class="message incoming">
          <p class="text">${msg.content}</p>
        </div>
      `
    }
    messagesDiv.appendChild(row)
  })
  messagesDiv.scrollTop = messagesDiv.scrollHeight
}


export async function sendMessage() {
  const input = document.getElementById("message-input")
  const text = input.value.trim()

  if (!text || !state.ACTIVE_CONVERSATION_ID) return

  await sendMessageApi(state.ACTIVE_CONVERSATION_ID, text)

  input.value = ""
  loadMessages()
}
