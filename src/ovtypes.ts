export class Card {
    alias: string
    mediumId: string
    balance: number
    balanceDate: number
    defaultCard: boolean
    status: string
    expiryDate: number
    autoReloadEnabled: boolean
    type: string
    statusAnnouncement: string
    transactions: [Transaction]
}

export class Transaction {
}