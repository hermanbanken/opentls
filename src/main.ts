/// <reference path="../typings/index.d.ts" />
import 'whatwg-fetch';
import 'moment-timezone';
import download from './download';
import fetch from './fetch';
import { Promise } from './promise';
import { Card, Travel, Route, Transaction } from './ovtypes';
import './utils';

let downloader = download(fetch);
export { downloader };

function extract() {
    var cards: Card[] = require('../python/ov3.json').map((t: any) => new Card(t));
    var travels = cards.map(c => Travel.extract(c.transactions));
    travels.forEach(travels => {
        console.log(travels)
        console.log(travels.length)
    });
}
export default extract

let moment = require('moment-timezone');
let OV = require('../python/ov3.json').map((c: any) => new Card(c));

// if(typeof window != 'undefined') {
//     var scope: any = window
//     scope.run = run;
// }

if(typeof Vue != 'undefined') {

const DAYS = "zo,ma,di,wo,do,vr,za".split(",")
    
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

Vue.filter('weekDay', function (timestamp: number) {
    var day = DAYS[parseInt(moment(timestamp).format("e"))];
    return day;
})

Vue.filter('toUpper', function (text: string) {
    return text && text.toUpperCase();
})

Vue.filter('euro', function (money: number) {
    if(typeof money == 'number')
        return ("€ " + money.toFixed(2).replace(',', '').replace('.', ','))
    if(typeof money == 'string')
        return "€ " + money;
})

Vue.filter('travelFilter', function (list: Travel[], filters: any[]) {
    if(!list || !filters || filters.length == 0) return list;
    return list.filter(travel => {
        var day = DAYS[parseInt(moment(travel.in.timestamp).format("e"))];
        return filters.some(filter => {
            return filter.enabled !== false && 
                filter.days.indexOf(day) >= 0 && (
                filter.location == travel.in.location || 
                filter.location == travel.out.location
            );
        }); 
    });
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
        },
        filters: [],
        filter: {
            location: []
        }
    },
    computed: {
        travels: function(){
            var travels = Travel.extract(this.cards[0].transactions);
            return travels.reduce((p, n) => p.concat(n), []);
        },
        routes: function(){
            return (<Travel[]>this.travels)
                .map(t => new Route(t))
                .distinct();
        },

        locations: function() {
            return (<Route[]>this.routes)
                .map(r => [r.a, r.b])
                .flatten()
                .distinct();
        }
    },
    methods: {
        cardTravels: function(card: Card, filter: any){
            var travels = Travel.extract(card.transactions);
            if(filter) {
                var f = Vue.filter('travelFilter')
                return f(travels, filter)
            }
            return travels;
        },
        addEmptyFilter: function(){
            this.filters.push({ location: null, days: [], enabled: true });
        },
        toggleDays: function(list: string[], which: string[] | string) {
            if(typeof which == 'string') {
                if(which == 'all') which = <string[]>this.days();
                else if(which == 'work') which = <string[]>this.days().slice(0, 5)
                else which = [<string>which]; 
            }
            var enable = !which.every(f => list.indexOf(f) >= 0);
            which.forEach(f => {
                var index = list.indexOf(f)
                if(enable && index < 0) {
                    list.push(f);
                } else if(!enable && index >= 0) {
                    list.splice(index, 1);
                }
            })
        },
        toggleLocation: function(location: string, which: string[] | string) {
            if(typeof which == 'string') {
                if(which == 'all') which = <string[]>this.days();
                else if(which == 'work') which = <string[]>this.days().slice(0, 5)
                else which = [<string>which]; 
            }
            var filters = which.map(w => location+","+w);
            var enable = !filters.every(f => this.filter.location.indexOf(filters[0]) >= 0);
            filters.forEach(f => {
                console.log('toggling', f)
                var index = this.filter.location.indexOf(f)
                if(enable && index < 0) {
                    this.filter.location.push(f);
                } else if(!enable && index >= 0) {
                    this.filter.location.splice(index, 1);
                }
            })
        },
        days: function(){
            return ["ma", "di", "wo", "do", "vr", "za", "zo"]
        },
        minDate: function(travels: Travel[]) {
            return travels.reduce(
                (p: number, t: any) =>
                (p != -1) ? Math.min(p, t.in.timestamp) : t.in.timestamp, 
                -1
            )
        },
        maxDate: function(travels: Travel[]) {
            return travels.reduce(
                (p: number, t: any) =>
                (p != -1) ? Math.max(p, t.in.timestamp) : t.in.timestamp, 
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
        fareSum: function(travels: Travel[]) {
            return travels.reduce(
                (p: number, t: any) => 
                p + (t.fare || 0), 
                0
            )
        },
        saveFilters: function () {
            localStorage.setItem("filters", JSON.stringify(this.filters));
        }
    },
    ready: function(){
        this.filters = JSON.parse(localStorage.getItem("filters")) || [];
        this.$watch('filters', this.saveFilters, {
            deep: true
        })
    }
})

}