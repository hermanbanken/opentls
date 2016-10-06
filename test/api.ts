/// <reference types="node" />
/// <reference types="mocha" />

import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import download, { ContinueFilter } from '../src/download'
import fetch from './../src/fetch'
import { Card, Travel, Route, Transaction } from './../src/ovtypes'

const sample: Card[] = require('../../api_sample.json').map((c: any) => new Card(c));
let downloader = download(fetch)
let singlePageFilter: ContinueFilter = () => false

function assertFields<T>(resourceName: string, fields: string[], object: T | null = null) {
    if (object == null) {
        return function (object: T) {
            if (object == null) throw new Error(`API gave back null resource ${resourceName}`);
            assertFields(resourceName, fields, object);
        }
    }
    let expectedFields = fields.sort((a, b) => a.localeCompare(b));
    let actualFields = Object.keys(object).sort((a, b) => a.localeCompare(b));

    var error = new Error(`API gave back different fields for resource ${resourceName}. 
    Given:    ${actualFields}
    Expected: ${expectedFields}`);

    if (expectedFields.length != actualFields.length) {
        throw error;
    }

    for (var i = 0; i < expectedFields.length; i++) {
        if (expectedFields[i] != actualFields[i]) {
            throw error;
        }
    }
}

const card_fields = ['alias', 'mediumId', 'balance', 'balanceDate', 'defaultCard', 'status', 'expiryDate', 'autoReloadEnabled', 'type', 'statusAnnouncement', 'transactions']
const transaction_fields = ["checkInInfo", "checkInText", "fare", "fareCalculation", "fareText", "modalType", "productInfo", "productText", "pto", "transactionDateTime", "transactionInfo", "transactionName", "ePurseMut", "ePurseMutInfo", "transactionExplanation", "transactionPriority"]

@suite class API {
    @test
    connect() {
        return downloader(
            process.env.API_USERNAME,
            process.env.API_PASSWORD,
            singlePageFilter
        ).then(function (cards) {
            cards.forEach(assertFields("Card", card_fields));
            cards.forEach(card => card.transactions.forEach(assertFields("Transaction", transaction_fields)));
            return cards;
        })
    }

    @test
    parseSample() {
        var travels = Travel.extract(sample[0].transactions)
        console.log(travels)
        if (travels.length != 2) {
            throw new Error("Should contain 2 travels, Delft <=> Utrecht Centraal and Rotterdam Centraal <=> Den Haag HS")
        }
    }
}