import { v4 } from 'uuid'

export async function encrypt(
  text: string,
  password: string
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const key = await getKey(password, true)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // Genera un vettore di inizializzazione casuale
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  )
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

export async function decrypt(
  encryptedText: string,
  iv: string,
  password: string
): Promise<string> {
  const decoder = new TextDecoder()
  const encryptedData = Uint8Array.from(atob(encryptedText), (c) =>
    c.charCodeAt(0)
  )
  const ivArray = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))
  const key = await getKey(password, false)
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    encryptedData
  )
  return decoder.decode(decryptedData)
}

async function getKey(
  password: string,
  isEncrypt: boolean
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    isEncrypt ? ['encrypt'] : ['decrypt']
  )
}

export function validateUUID(uuid: string) {
  return /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/i.test(
    uuid
  )
}

export function UUID() {
  return v4()
}
