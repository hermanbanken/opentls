/// <reference path="../typings/index.d.ts" />
import 'whatwg-fetch';

let OV = require('json!../python/ov.json')

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

new Vue({
    el: '#app',
    data: OV
})
