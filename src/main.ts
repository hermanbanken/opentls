/// <reference path="../typings/index.d.ts" />
import 'whatwg-fetch';

let OV = require('../python/ov.json')

function formData(obj: { [s: string]: (string | number); }) {
    let data = new FormData()
    data.append('user', 'hubot')
    for(let key in obj) {
        data.append(key, obj[key])
    }
    return data
}

const CLIENT_ID     = "nmOIiEJO5khvtLBK9xad3UkkS8Ua"
const CLIENT_SECRET = "FE8ef6bVBiyN0NeyUJ5VOWdelvQa"

class Transaction {

}

function get_token(username: string, password: string, client_id = CLIENT_ID, client_secret = CLIENT_SECRET): Promise<any> {
    console.log("getting token")
    return fetch("https://login.ov-chipkaart.nl/oauth2/token", {
        method: 'POST',
        body: formData({
            username,
            password,
            client_id,
            client_secret,
            grant_type: "password",
            scope: "openid"
        })
    })
    .then(response => response.json())
}

function refresh_token(refresh_token: string, client_id = CLIENT_ID, client_secret = CLIENT_SECRET): Promise<Response> {
    return fetch("https://login.ov-chipkaart.nl/oauth2/token", {
        method: 'POST',
        body: formData({
            refresh_token,
            client_id,
            client_secret,
            grant_type: "refresh_token"
        })
    })
    .then(response => response.json())   
}

function get_authorization(id_token: string): Promise<any> {
    return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/api/authorize", {
        method: 'POST',
        body: formData({
            authenticationToken: id_token
        })
    })
    .then(response => response.json())
    .then(json => json['o'])
}

function get_cards_list(authorizationToken: string, locale="nl-NL"): Promise<any> {
    return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/cards/list", {
        method: 'POST',
        body: formData({
            authorizationToken,
            locale
        })
    })
    .then(response => response.json())
    .then(json => json['o'])
}

function get_transaction_list(authorizationToken: string, mediumId: string, offset = 0, locale="nl-NL"): Promise<[Transaction]> {
    let data: { [s: string]: (string | number) } = {
        authorizationToken,
        mediumId,
        offset,
        locale
    }
    return fetch("https://api2.ov-chipkaart.nl/femobilegateway/v1/transaction/list", {
        method: 'POST',
        body: formData(data)
    })
    .then(response => response.json())
    .then(json => json['o'])
    .then(result => {
        let head: [Transaction] = result.records;
        if(offset < result.nextOffset) {
            return get_transaction_list(
                authorizationToken, mediumId, 
                parseInt(result.nextOffset), locale
            )
            .then(tail => head.concat(tail))
        } else {
            return head
        }
    })
}

Vue.filter('date', function (timestamp: number) {
    let date = new Date(timestamp || 0);
    let day = date.toISOString().slice(0, 10);
    let time = date.toISOString().slice(11,19);
    return `${day} ${time}`;
})

Vue.filter('dateTime', function (timestamp: number) {
    let date = new Date(timestamp || 0);
    let time = date.toISOString().slice(11,19);
    return time;
})

Vue.filter('dateDay', function (timestamp: number) {
    let date = new Date(timestamp || 0);
    let day = date.toISOString().slice(0, 10);
    return day;
})

Vue.filter('toUpper', function (text: string) {
    return text && text.toUpperCase();
})

new Vue({
    el: '#app',
    data: { 
        cards: OV,
        person: {
            name: "John Doe",
            address: {
                city: "Amsterdam",
                zipcode: "1000AA",
                street: "Prinsengracht 1",
            }
        }
    },
    methods: {
        minDate: function(card: any) {
            return card.transactions.reduce(
                (p: number, t: any) => 
                (p != -1) ? Math.min(p, t.transactionDateTime) : t.transactionDateTime, 
                -1
            )
        },
        maxDate: function(card: any) {
            return card.transactions.reduce(
                (p: number, t: any) => 
                (p != -1) ? Math.max(p, t.transactionDateTime) : t.transactionDateTime, 
                -1
            )
        },
        chargeSum: function(card: any) {
            return card.transactions.reduce(
                (p: number, t: any) => 
                p + Math.max(0, t.ePurseMut), 
                0
            )
        },
        fareSum: function(card: any) {
            return card.transactions.reduce(
                (p: number, t: any) => 
                p + (t.fare || 0), 
                0
            )
        }
    },
    ready: function(){
        this.cards.forEach((card: any) => {
            card.transactions = card.transactions.filter((c: any) => c.transactionName == 'Check-uit' || c.transactionName == 'Check-in');
            for(var i = 0; i < card.transactions.length; i++) {
                let d = card.transactions[i];
                let next = card.transactions[i+1];
                if(d.transactionName == 'Check-in' && next && next.transactionName == "Check-uit") {
                    Vue.set(next, "checkInTime", d.transactionDateTime);
                }
                if(d.transactionName == 'Check-uit') {
                    Vue.set(d, "checkOutInfo", d.transactionInfo);
                    Vue.set(d, "checkOutTime", d.transactionDateTime);
                }
            }
            card.transactions = card.transactions.filter((c: any) => c.transactionName == 'Check-uit');
        })
    }
})
