import { Promise } from './promise'

interface Response {
    json(): Promise<any>
}

interface NodeResponse {
    statusCode: number;
}

interface FetchResponse extends Response {
    status: number;
    statusText: string;
    ok: boolean;
}

declare function fetch(url: string, opts: any): Promise<FetchResponse> 

function nodeJsonResponse(body: string): Response {
    return {
        json: function(): Promise<any> {
            return new Promise(function(resolve, reject) {
                try {
                    resolve(JSON.parse(body));
                } catch(e) {
                    reject(e);
                }
            });
        }
    };
}

function nodeFetch(url: string, opts: any): Promise<Response> {
    let request = require('request')
    if(typeof opts.body == 'object') {
        opts.form = opts.body
        opts.headers = opts.headers || {}
        opts.headers['content-type'] = 'application/x-www-form-urlencoded'
        opts.headers['accept'] = 'application/json'
        delete opts.body;
    }
    opts.url = url;
    return new Promise(function(resolve, reject) {
        request(opts, function (error: Error | null, response: NodeResponse, body: string) {
            if(error || response.statusCode != 200) 
                return reject(error || new Error(""+response.statusCode));
            else resolve(nodeJsonResponse(body));
        })
    })
}

function formData(obj: { [s: string]: (string | number); }) {
    let data = new FormData()
    Object.keys(obj).forEach(key => {
        console.log("append", key, obj[key])
        data.append(key, obj[key]);
    })
    return data
}

export default function multiEnvFetch<T extends Response>(url: string, opts: any): Promise<T> {
    // NodeJS alternative
    if(typeof window == 'undefined') {
        return nodeFetch(url, opts);
    }
    else 
    // Browser alternative
    if(typeof fetch == 'function' && typeof FormData != 'undefined') {
        if(typeof opts.body == 'object' && !(opts.body instanceof FormData)) {
            opts.body = formData(opts.body)
            opts.headers = { 
                "accept": "application/json", 
                "content-type": "application/x-www-form-urlencoded"
            }
        }
        console.log("fetch", url, opts)
        return fetch(url, opts).then((r: FetchResponse) => {
            if(!r.ok) {
                console.warn(r.status, r.statusText);
                throw new Error(r.statusText)
            }
            return r as Response;
        });
    } else {
        console.log("Either use fetch from NodeJS environment or from browser which FormData and fetch API (or polyfills).")
    }
}