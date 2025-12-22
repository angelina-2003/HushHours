import { state } from "../state.js"
import { dom } from "../utils/dom.js"
import { renderGroups } from "./groups.js"
import { loadGroupMessages, sendGroupMessage } from "./groupMessages.js"

export async function renderGroupChatView() {
  // Remove create group button when opening a group chat
  const pageHeader = document.querySelector(".page-header")
  if (pageHeader) {
    const existingBtn = pageHeader.querySelector(".create-group-header-btn")
    if (existingBtn) {
      existingBtn.remove()
    }
  }
  
  // Show top bar for group chat view
  const topBar = dom.topBar()
  if (!topBar) {
    console.error("[DEBUG groupChat] Top bar not found!")
    return
  }
  
  topBar.style.display = "flex"
  
  // Get group name from page title or use a default
  const pageTitleEl = dom.pageTitle()
  const groupName = (pageTitleEl && pageTitleEl.innerText) ? pageTitleEl.innerText : "Group Chat"
  
  // Check if user is a member
  let isMember = false
  try {
    const response = await fetch(`/groups/${state.ACTIVE_GROUP_ID}`, {
      credentials: "include"
    })
    if (response.ok) {
      const groupData = await response.json()
      isMember = true
      // Update group name from response if available
      if (groupData.name) {
        pageTitleEl.innerText = groupData.name
      }
    } else if (response.status === 403) {
      // User is not a member
      isMember = false
    }
  } catch (error) {
    console.error("[DEBUG groupChat] Error checking membership:", error)
    isMember = false
  }
  
  topBar.innerHTML = `
    <button class="back-button">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>
    <h2 class="chat-header-title" id="group-header-title" style="cursor: pointer; user-select: none; pointer-events: auto;">${groupName}</h2>
  `
  
  // Make group header clickable to show group info
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    const groupHeaderTitle = document.getElementById("group-header-title")
    if (groupHeaderTitle) {
      console.log("[DEBUG groupChat] Setting up group header click handler")
      groupHeaderTitle.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("[DEBUG groupChat] Group header clicked!")
        showGroupInfoPage()
      }
      // Also add touch event for mobile
      groupHeaderTitle.ontouchstart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("[DEBUG groupChat] Group header touched!")
        showGroupInfoPage()
      }
    } else {
      console.error("[DEBUG groupChat] Group header title element not found!")
    }
  }, 100)
  
  topBar.querySelector(".back-button").onclick = async () => {
    console.log("[DEBUG groupChat] Back button clicked, CAME_FROM_GROUPS:", state.CAME_FROM_GROUPS)
    
    // Go back to the appropriate tab based on where we came from
    const { showTab } = await import("./navigation.js")
    
    if (state.CAME_FROM_GROUPS) {
      // If we came from groups page, go back to groups
      state.CAME_FROM_GROUPS = false  // Reset flag
      showTab("groups")
      const { renderGroups } = await import("./groups.js")
      await renderGroups()
    } else {
      // Otherwise go back to chats list
      showTab("chats")
      const { renderChats } = await import("./chats.js")
      await renderChats()
    }
  }
  
  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) card.classList.add("chat-active")
  if (bottomNav) bottomNav.style.display = "none"
  
  // Ensure avatar click handler is set up even when bottom nav is hidden
  setTimeout(() => {
    const avatarImg = dom.avatarImg()
    const avatarNavItem = document.querySelector(".avatar-nav")
    
    if (avatarImg) {
      avatarImg.style.cursor = "pointer"
      avatarImg.onclick = (e) => {
        e.stopPropagation()
        // Navigate to profile tab
        import("./navigation.js").then(({ showTab }) => {
          showTab("avatar")
        })
      }
    }
    
    if (avatarNavItem) {
      avatarNavItem.style.cursor = "pointer"
      avatarNavItem.onclick = (e) => {
        e.stopPropagation()
        import("./navigation.js").then(({ showTab }) => {
          showTab("avatar")
        })
      }
    }
  }, 100)
  
  dom.content().className = "app-content chat-active group-chat-active"
  
  // Always show chat interface, but disable input if not a member
  dom.content().innerHTML = `
    <div class="chat-window">
      <div class="messages" id="group-messages"></div>
      <div class="chat-input">
        <input id="group-message-input" placeholder="${isMember ? 'Type a message' : 'Join to send messages'}" ${isMember ? '' : 'disabled'}>
        ${!isMember ? `
          <button class="group-join-input-btn" id="join-group-input-btn">
            <i class="fa-solid fa-plus"></i>
            <span>Join</span>
          </button>
        ` : ''}
        <button id="group-send-button" ${isMember ? '' : 'style="display: none;"'}>↑</button>
      </div>
    </div>
  `
  
  // Try to load messages (even if not a member, they might be able to view)
  try {
    await loadGroupMessages(state.ACTIVE_GROUP_ID)
  } catch (error) {
    console.error("[DEBUG groupChat] Error loading messages (might not be a member):", error)
    // If not a member, show empty messages - that's okay
    const messagesDiv = document.getElementById("group-messages")
    if (messagesDiv && !isMember) {
      messagesDiv.innerHTML = `<p style="opacity:0.6; text-align:center; padding:20px;">Join the group to see messages</p>`
    }
  }
  
  // Setup join button if not a member
  if (!isMember) {
    const joinBtn = document.getElementById("join-group-input-btn")
    if (joinBtn) {
      joinBtn.onclick = async () => {
        try {
          const response = await fetch(`/groups/${state.ACTIVE_GROUP_ID}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          })
          
          if (response.ok) {
            // IMPORTANT: Don't call renderGroups() or renderChats() as they will replace the content
            // Just reload the chat view (now as a member) - stays on chat screen
            // The group will appear in all-chats when user navigates there naturally
            await renderGroupChatView()
          } else {
            const data = await response.json().catch(() => ({}))
            alert(data.error || "Failed to join group")
          }
        } catch (error) {
          console.error("[DEBUG groupChat] Error joining group:", error)
          alert("Failed to join group. Please try again.")
        }
      }
    }
  } else {
    // Setup message sending if member
    const messageInput = document.getElementById("group-message-input")
    const sendButton = document.getElementById("group-send-button")
    
    const sendMessage = async () => {
      const content = messageInput.value.trim()
      if (!content) return
      
      messageInput.value = ""
      await sendGroupMessage(state.ACTIVE_GROUP_ID, content)
    }
    
    sendButton.onclick = sendMessage
    messageInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    }
    
    // Focus input
    messageInput.focus()
  }
}

async function showGroupInfoPage() {
  try {
    // Store the previous view state
    state.PROFILE_VIEW_PREVIOUS_GROUP_ID = state.ACTIVE_GROUP_ID
    state.PROFILE_VIEW_PREVIOUS_PAGE_TITLE = dom.pageTitle()?.innerText || null
    
    // Fetch group info including members
    const response = await fetch(`/groups/${state.ACTIVE_GROUP_ID}`, {
      credentials: "include"
    })
    
    if (!response.ok) {
      alert("Failed to load group information")
      return
    }
    
    const groupData = await response.json()
    
    // Generate join link
    const joinLink = `${window.location.origin}/groups/join/${state.ACTIVE_GROUP_ID}`
    
    // Hide bottom nav and show top bar with back button
    dom.bottomNav().style.display = "none"
    const topBar = dom.topBar()
    topBar.style.display = "flex"
    
    topBar.innerHTML = `
      <button class="back-button" id="group-info-back-btn">
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back</span>
      </button>
      <h2 class="chat-header-title">Group Info</h2>
    `
    
    // Back button functionality
    const backBtn = document.getElementById("group-info-back-btn")
    backBtn.onclick = async () => {
      // Restore the group chat view
      state.ACTIVE_GROUP_ID = state.PROFILE_VIEW_PREVIOUS_GROUP_ID
      if (state.PROFILE_VIEW_PREVIOUS_PAGE_TITLE) {
        dom.pageTitle().innerText = state.PROFILE_VIEW_PREVIOUS_PAGE_TITLE
      }
      state.PROFILE_VIEW_PREVIOUS_GROUP_ID = null
      state.PROFILE_VIEW_PREVIOUS_PAGE_TITLE = null
      await renderGroupChatView()
    }
    
    // Render the full page
    dom.content().className = "app-content group-info-content"
    dom.content().innerHTML = `
      <div class="group-info-container">
        <!-- Group Name -->
        <div class="group-info-header">
          <h1 class="group-info-name">${escapeHtml(groupData.name || 'Group')}</h1>
        </div>
        
        <!-- Join Link Section -->
        <div class="group-info-section">
          <h3 class="group-info-section-title">Group Invite Link</h3>
          <div class="group-link-container">
            <input type="text" id="group-join-link-input" class="group-link-input" value="${joinLink}" readonly>
            <button id="copy-group-link-btn" class="group-link-copy-btn">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
          <p class="group-link-hint">Share this link to let others join the group</p>
        </div>
        
        <!-- Members Section -->
        <div class="group-info-section">
          <h3 class="group-info-section-title">Members (${groupData.members?.length || 0})</h3>
          <div class="group-members-list" id="group-members-list">
            ${(groupData.members || []).map(member => `
              <div class="group-member-item">
                <img src="/static/avatars/${member.avatar || 'default.png'}" 
                     onerror="this.src='/static/avatars/default.png'"
                     class="group-member-avatar"
                     alt="${escapeHtml(member.display_name || member.username)}">
                <div class="group-member-info">
                  <div class="group-member-name">${escapeHtml(member.display_name || member.username)}</div>
                  <div class="group-member-username">@${escapeHtml(member.username)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
    
    // Copy link functionality
    const copyBtn = document.getElementById("copy-group-link-btn")
    const linkInput = document.getElementById("group-join-link-input")
    
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(joinLink)
        copyBtn.classList.add("copied")
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>'
        setTimeout(() => {
          copyBtn.classList.remove("copied")
          copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>'
        }, 2000)
      } catch (err) {
        linkInput.select()
        document.execCommand("copy")
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>'
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>'
        }, 2000)
      }
    }
    
    // Allow clicking on input to select
    linkInput.onclick = () => {
      linkInput.select()
    }
    
  } catch (error) {
    console.error("[DEBUG groupChat] Error showing group info:", error)
    alert("Failed to load group information")
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

