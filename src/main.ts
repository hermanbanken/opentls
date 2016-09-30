/// <reference path="../typings/index.d.ts" />
import 'whatwg-fetch';
import 'moment-timezone';
import download from './download';
import fetch from './fetch';
import { Promise } from './promise';

let downloader = download(fetch);
export = downloader;

let moment = require('moment-timezone');
let OV = require('../python/log.json')

// if(typeof window != 'undefined') {
//     var scope: any = window
//     scope.run = run;
// }

if(typeof Vue != 'undefined') {

Vue.filter('reverse', function <T> (list: [T]) {
    return list.slice().reverse();
})

Vue.filter('date', function (timestamp: number) {
    return moment(timestamp).tz('Europe/Amsterdam').format('DD-MM-YYYY HH:mm')
})

Vue.filter('dateTime', function (timestamp: number) {
    return moment(timestamp).tz('Europe/Amsterdam').format('HH:mm')
})

Vue.filter('dateDay', function (timestamp: number) {
    return moment(timestamp).tz('Europe/Amsterdam').format('DD-MM-YYYY')
})

Vue.filter('toUpper', function (text: string) {
    return text && text.toUpperCase();
})

Vue.filter('euro', function (money: number) {
    return money && ("€ " + money.toFixed(2).replace(',', '').replace('.', ','));
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
                let next = card.transactions[i-1];
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

}