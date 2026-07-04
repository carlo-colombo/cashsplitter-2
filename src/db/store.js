const DB_NAME = 'cashsplitter'
const DB_VERSION = 1
const STORE_NAME = 'events'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export async function addEvent(event) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const doc = {
      id: generateId(),
      type: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
    }
    const request = store.add(doc)
    request.onsuccess = () => resolve(doc)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getAllEvents() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const events = request.result.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      )
      resolve(events)
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getEventsByGroup(groupId) {
  const all = await getAllEvents()
  return all.filter((e) => e.data && e.data.groupId === groupId)
}
