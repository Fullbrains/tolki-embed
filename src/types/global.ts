// Global window extensions
declare global {
  interface Window {
    tolki?: {
      cart?: {
        items: Array<{
          product_url: string
          image_url: string
          title: string
          price: string
          quantity: number
          subtotal: string
        }>
        total: string
        subtotal: string
        item_count: number
        status?: 'loading' | 'loaded'
      }
      links?: {
        [key: string]: string | undefined
      }
      orders?: {
        [status: string]: Array<{
          order_id?: number | string
          order_number?: string
          order_url?: string
          total?: string
          date_created?: string
          date_modified?: string
          status?: string
          status_label?: string
          items?: Array<{
            product_url?: string
            image_url?: string
            title?: string
            price?: string
            quantity?: number
          }>
        }>
      }
      loaded?: boolean
      update?: () => void
    }
    ActionCommands?: {
      [commandName: string]: (data?: any, item?: any) => void | Promise<void>
    }
  }
}

export {}  // Make this a module