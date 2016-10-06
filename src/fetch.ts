interface NodeResponse {
    statusCode: number;
}

function ab2str(buf: ArrayBuffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str: string) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

class NodeRes implements Response {
    type: ResponseType = "default"
    url: string = ""
    redirected = false
    status: number
    ok: boolean
    statusText: string
    headers: any = {}
    bodyString: string
    body: ReadableStream
    trailer: Promise<Headers>
    bodyUsed: boolean = false
    arrayBuffer(): Promise<ArrayBuffer> { return Promise.resolve(str2ab(this.bodyString)) }
    blob(): Promise<string> { return Promise.resolve(this.bodyString) }
    formData(): Promise<FormData> { return Promise.reject("") }
    json(): Promise<any> { return new Promise((resolve, reject) => {
        if(this.status != 200) {
            return reject(this.statusText || this.bodyString)
        }

        try {
            resolve(JSON.parse(this.bodyString))
        } catch(e) {
            console.warn(this.bodyString)
            throw e
        }
    }) }
    text(): Promise<string> { return Promise.resolve(this.bodyString) }

    clone(): Response {
        return this
    }

    constructor(url: string, status: number, statusText: string, body: string) {
        this.status = status
        this.statusText = statusText
        this.ok = status == 200
        this.bodyString = body
    }
}

interface FetchResponse extends Response {
    status: number;
    statusText: string;
    ok: boolean;
}

declare function fetch(url: string, opts: any): Promise<Response> 

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
            resolve(new NodeRes(url, response.statusCode, error && error.message, body))
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