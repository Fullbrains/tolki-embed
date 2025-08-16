import { v4 } from 'uuid'

export function validateUUID(uuid: string) {
  return /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/i.test(
    uuid
  )
}

export function UUID() {
  return v4()
}
