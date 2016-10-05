let moment = require('moment-timezone');

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
    transactions: Transaction[]

    constructor(object: { [k: string]: any }) {
        var self = mix(this, object);
        self.transactions = (self.transactions || []).map(t => new Transaction(t));
        return self;
    }
}

// https://github.com/Microsoft/TypeScript/issues/3895#issuecomment-183077428
function mix<T, U extends {[k: string]: {}}>(func: T, properties: U): T & U {
    Object.keys(properties).forEach(k => (func as any)[k] = properties[k]);
    return func as T & U;
}

export class Transaction {
    constructor(object: { [k: string]: any }) {
        return mix(this, object);
    }

    checkInInfo: string
    checkInText: string
    fare: number | null
    fareCalculation: string
    fareText: string

    modalType: string
    productInfo: string
    productText: string
    pto: string

    transactionDateTime: number
    transactionInfo: string
    transactionName: string
    transactionExplanation: string
    transactionPriority: string

    ePurseMut: number
    ePurseMutInfo: string

    action(): TransactionAction {
        return new TransactionAction(this);
    }
}

export class TransactionAction {
    constructor(t: Transaction) {
        this.location = t.transactionInfo

        var date = moment(t.transactionDateTime).tz('Europe/Amsterdam')
        this.date = date.format('DD-MM-YYYY')
        this.time = date.format('HH:mm')
        this.timestamp = t.transactionDateTime
    }

    timestamp: number;
    date: string
    time: string
    location: string
}

export class Travel {
    in: TransactionAction
    out: TransactionAction
    fare: string
    product: string
    notes: string
    modalType: string

    constructor(tin: Transaction, tout: Transaction) {
        this.in = tin.action();
        this.out = tout.action();
        
        this.fare = (tout.fare && tout.fare.toFixed(2).replace('.', ',')) || null;
        this.product = tout.productInfo
        this.modalType = tout.modalType
        this.notes = ''
    }

    static extract(input: Transaction[]): Travel[] {
        var sorted = input
            .filter(a => isIn(a) || isOut(a))
            .sort((a, b) => a.transactionDateTime - b.transactionDateTime)
        return pairwise(sorted, (a, b) => {
            if(isIn(a) && isOut(b) && a.transactionInfo == b.checkInInfo) {
                if(a.transactionDateTime > b.transactionDateTime) {
                    throw new Error("Invalid sort!")
                }
                return [new Travel(a, b)];
            } else {
                return []
            }
        })
    }
}

export interface IComparable {
    localeCompare<T extends IComparable>(other: T): number
}

export class Route implements IComparable {
    a: string
    b: string
    modalType: string
    constructor(travel: Travel) {
        this.modalType = travel.modalType;
        [this.a, this.b] = [travel.in.location, travel.out.location].sort();
    }
    localeCompare(other: Route): number {
        if(this.a != other.a) 
            return this.a.localeCompare(other.a);
        if(this.b != other.b) 
            return this.b.localeCompare(other.b);
        return this.modalType.localeCompare(other.modalType);
    }
}

function isIn(a: Transaction): boolean {
    return a.transactionName == "Check-in"
}

function isOut(a: Transaction): boolean {
    return a.transactionName == "Check-uit"
}

function pairwise<T,R>(list: T[], func: (a: T,b: T)=>R[]): R[] {
    var ret: R[] = new Array<R>();
    for(var i = 0; i < list.length - 1; i++) {
        ret.push.apply(ret, func(list[i], list[i+1]));
    }
    return ret;
}