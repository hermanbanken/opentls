import { Card, Transaction } from './ovtypes'

export type Fetch = (url: string, options: any) => Promise<Response>

const CLIENT_ID     = "nmOIiEJO5khvtLBK9xad3UkkS8Ua"
const CLIENT_SECRET = "FE8ef6bVBiyN0NeyUJ5VOWdelvQa"

export type ContinueFilter = (currentOffset: number, nextOffset: number, transactions: Transaction[]) => boolean;

export default function(fetch: Fetch): (username: string, password: string, filter: ContinueFilter) => Promise<[Card]> {

    function get_token(username: string, password: string, client_id = CLIENT_ID, client_secret = CLIENT_SECRET): Promise<any> {
        return fetch("https://login.ov-chipkaart.nl/oauth2/token", {
            method: 'POST',
            body: {
                username,
                password,
                client_id,
                client_secret,
                grant_type: "password",
                scope: "openid"
            }
        })
        .then((response: Response) => response.json())
    }

    function refresh_token(refresh_token: string, client_id = CLIENT_ID, client_secret = CLIENT_SECRET): Promise<Response> {
        return fetch("https://login.ov-chipkaart.nl/oauth2/token", {
            method: 'POST',
            body: {
                refresh_token,
                client_id,
                client_secret,
                grant_type: "refresh_token"
            }
        })
    }

    function get_authorization(id_token: string): Promise<any> {
        return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/api/authorize", {
            method: 'POST',
            body: {
                authenticationToken: id_token
            }
        })
        .then((response: Response) => response.json())
        .then((json: any) => json['o'])
    }

    function get_cards_list(authorizationToken: string, locale="nl-NL"): Promise<[Card]> {
        return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/cards/list", {
            method: 'POST',
            body: {
                authorizationToken,
                locale
            }
        })
        .then((response: Response) => response.json())
        .then((json: any) => {
            let o = json['o']
            if(json['c'] == 200 && typeof o == 'object' && Array.isArray(o)) {
                return o as [Card]
            } else {
                throw new Error(json['e'])
            }
        })
    }

    function get_transaction_list(authorizationToken: string, mediumId: string, filter: ContinueFilter, offset = 0, locale="nl-NL"): Promise<[Transaction]> {
        let data: { [s: string]: (string | number) } = {
            authorizationToken,
            mediumId,
            offset,
            locale
        }
        return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/transaction/list", {
            method: 'POST',
            body: data
        })
        .then((response: Response) => response.json())
        .then((json: any) => json['o'])
        .then((result: any) => {
            let head: [Transaction] = result.records;
            if(filter(offset, result.nextOffset, head)) {
                return get_transaction_list(
                    authorizationToken, mediumId, 
                    filter,
                    parseInt(result.nextOffset), locale
                )
                .then((tail: [Transaction]) => head.concat(tail))
            } else {
                return head
            }
        })
    }

    const defaultFilter: ContinueFilter = (currentOffset: number, nextOffset: number, transactions: Transaction[]) => {
        return currentOffset < nextOffset;
    } 

    return function run(username: string, password: string, filter: ContinueFilter = defaultFilter): Promise<[Card]> {
        return get_token(username, password)
            .then(oauth => get_authorization(oauth["id_token"]))
            .then(auth => get_cards_list(auth)
                .then((cards: [Card]) => Promise.all(cards.map((card: Card) =>
                    get_transaction_list(auth, card.mediumId, filter).then(ts => {
                        card.transactions = ts
                        return card
                    })
                )))
            )
    }
}

