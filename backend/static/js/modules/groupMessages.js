import { state } from "../state.js"
import { dom } from "../utils/dom.js"

export async function loadGroupMessages(groupId) {
  try {
    const response = await fetch(`/groups/${groupId}/messages`, {
      credentials: "include"
    })
    
    if (!response.ok) {
      throw new Error("Failed to load messages")
    }
    
    const messages = await response.json()
    const messagesDiv = document.getElementById("group-messages")
    
    if (!messagesDiv) return
    
    messagesDiv.innerHTML = ""
    
    messages.forEach(msg => {
      const isOwnMessage = msg.sender_id === state.CURRENT_USER_ID
      const messageRow = document.createElement("div")
      const avatar = msg.sender_avatar || 'default.png'
      const avatarSrc = `/static/avatars/${avatar}`
      
      if (isOwnMessage) {
        // Own message - right aligned
        messageRow.className = "message-row outgoing-row"
        // Get user's message color (from state or localStorage, default to grey)
        const messageColor = state.CURRENT_USER_MESSAGE_COLOR || localStorage.getItem("messageColor") || "#6b7280"
        messageRow.innerHTML = `
          <div class="message outgoing" style="background: ${messageColor};">
            <p class="text">${escapeHtml(msg.content)}</p>
          </div>
          <img class="message-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
        `
      } else {
        // Other's message - left aligned with sender name
        messageRow.className = "message-row incoming-row"
        messageRow.innerHTML = `
          <img class="message-avatar" src="${avatarSrc}" alt="${escapeHtml(msg.sender_display_name)}" onerror="this.src='/static/avatars/default.png'">
          <div class="message incoming">
            <div class="message-sender">${escapeHtml(msg.sender_display_name)}</div>
            <p class="text">${escapeHtml(msg.content)}</p>
          </div>
        `
      }
      
      messagesDiv.appendChild(messageRow)
    })
    
    // Scroll to bottom
    scrollToBottom()
    
  } catch (error) {
    console.error("[DEBUG groupMessages] Error loading messages:", error)
    const messagesDiv = document.getElementById("group-messages")
    if (messagesDiv) {
      messagesDiv.innerHTML = `<p class="error-message">Failed to load messages</p>`
    }
  }
}

export async function sendGroupMessage(groupId, content) {
  try {
    const response = await fetch(`/groups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content })
    })
    
    if (!response.ok) {
      throw new Error("Failed to send message")
    }
    
    // Reload messages to show the new one
    await loadGroupMessages(groupId)
    
  } catch (error) {
    console.error("[DEBUG groupMessages] Error sending message:", error)
    alert("Failed to send message. Please try again.")
  }
}

function scrollToBottom() {
  const messagesDiv = document.getElementById("group-messages")
  if (!messagesDiv) return
  
  // Multiple attempts to ensure scrolling works
  setTimeout(() => {
    const scrollHeight = messagesDiv.scrollHeight
    const clientHeight = messagesDiv.clientHeight
    messagesDiv.scrollTop = Math.max(0, scrollHeight - clientHeight)
  }, 0)
  
  setTimeout(() => {
    const scrollHeight = messagesDiv.scrollHeight
    const clientHeight = messagesDiv.clientHeight
    messagesDiv.scrollTop = Math.max(0, scrollHeight - clientHeight)
  }, 100)
  
  requestAnimationFrame(() => {
    const lastMessage = messagesDiv.lastElementChild
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  })
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatMessageTime(timestamp) {
  if (!timestamp) return ""
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

