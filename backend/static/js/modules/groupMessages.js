import { state } from "../state.js"
import { dom } from "../utils/dom.js"

// Function to determine if a color is light or dark
function isLightColor(color) {
  if (!color || !color.startsWith('#')) return false
  
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate luminance using relative luminance formula
  // https://www.w3.org/WAI/GL/wiki/Relative_luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // If luminance is greater than 0.5, it's a light color
  return luminance > 0.5
}

// Function to get appropriate text color based on background
function getTextColor(backgroundColor) {
  // Use subtle colors instead of pure black/white
  return isLightColor(backgroundColor) ? '#1a1a1a' : '#f5f5f5'  // Subtle black and subtle white
}

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
        // Get message color from database (stored with message) or fallback to user's current color
        const messageColor = msg.message_color || state.CURRENT_USER_MESSAGE_COLOR || localStorage.getItem("messageColor") || "#6b7280"
        console.log(`[DEBUG groupMessages] Outgoing message ${msg.id}:`, {
          msg_message_color: msg.message_color,
          state_color: state.CURRENT_USER_MESSAGE_COLOR,
          final_color: messageColor
        })
        // Create elements and set styles directly
        const messageDiv = document.createElement("div")
        messageDiv.className = "message outgoing"
        messageDiv.style.setProperty("background", messageColor, "important")
        messageDiv.style.setProperty("background-image", "none", "important")
        messageDiv.style.setProperty("background-color", messageColor, "important")
        // Use appropriate text color based on background brightness
        const textColor = getTextColor(messageColor)
        const isLight = isLightColor(messageColor)
        console.log(`[DEBUG groupMessages] Color ${messageColor} - isLight: ${isLight}, textColor: ${textColor}`)
        // Set color using cssText for maximum override
        messageDiv.style.cssText = `
          background: ${messageColor} !important;
          background-image: none !important;
          background-color: ${messageColor} !important;
          color: ${textColor} !important;
        `
        
        // Also set on the text element itself to ensure it applies
        const textP = document.createElement("p")
        textP.className = "text"
        textP.style.cssText = `color: ${textColor} !important; margin: 0; padding: 0;`
        textP.textContent = escapeHtml(msg.content)
        messageDiv.appendChild(textP)
        
        const avatarImg = document.createElement("img")
        avatarImg.className = "message-avatar"
        avatarImg.src = avatarSrc
        avatarImg.alt = "Avatar"
        avatarImg.onerror = function() { this.src = '/static/avatars/default.png' }
        
        messageRow.appendChild(messageDiv)
        messageRow.appendChild(avatarImg)
      } else {
        // Other's message - left aligned with sender name
        messageRow.className = "message-row incoming-row"
        // Use the sender's message color from database so everyone sees their chosen color
        const messageColor = msg.message_color || "#6b7280"  // Default grey if not set
        console.log(`[DEBUG groupMessages] Incoming message ${msg.id}:`, {
          msg_message_color: msg.message_color,
          final_color: messageColor
        })
        // Create elements and set styles directly
        const avatarImg = document.createElement("img")
        avatarImg.className = "message-avatar"
        avatarImg.src = avatarSrc
        avatarImg.alt = escapeHtml(msg.sender_display_name)
        avatarImg.onerror = function() { this.src = '/static/avatars/default.png' }
        
        // Use appropriate text color based on background brightness
        const textColor = getTextColor(messageColor)
        const isLight = isLightColor(messageColor)
        console.log(`[DEBUG groupMessages] Incoming - Color: ${messageColor}, isLight: ${isLight}, textColor: ${textColor}`)
        
        const messageDiv = document.createElement("div")
        messageDiv.className = "message incoming"
        // Set color using cssText for maximum override
        messageDiv.style.cssText = `
          background: ${messageColor} !important;
          background-image: none !important;
          background-color: ${messageColor} !important;
          color: ${textColor} !important;
        `
        
        // Remove sender name - user requested to remove username from top of text
        // Just add the message text directly
        
        // Also set on the text element itself to ensure it applies
        const textP = document.createElement("p")
        textP.className = "text"
        textP.style.cssText = `color: ${textColor} !important; margin: 0; padding: 0;`
        textP.textContent = escapeHtml(msg.content)
        messageDiv.appendChild(textP)
        
        messageRow.appendChild(avatarImg)
        messageRow.appendChild(messageDiv)
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

