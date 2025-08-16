export interface ApiResponse {
  status: number
  data: unknown
}

export enum ApiMessageResponseStatus {
  ok = 'ok',
  notOk = 'notOk',
  error = 'error',
  badMessage = 'badMessage',
}

export interface ApiMessageResponse {
  status: ApiMessageResponseStatus
  data: unknown
  response?: Partial<Response>
  error?: unknown
}